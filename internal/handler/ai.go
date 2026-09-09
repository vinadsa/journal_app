package handler

import (
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
)

type userRateLimit struct {
	lastRequest time.Time
	count       int
	windowStart time.Time
}

type AIHandler struct {
	aiService *service.AIService
	mu        sync.Mutex
	limits    map[string]*userRateLimit
}

func NewAIHandler(aiService *service.AIService) *AIHandler {
	return &AIHandler{
		aiService: aiService,
		limits:    make(map[string]*userRateLimit),
	}
}

// allowRequest implements a sliding window rate limiter per authenticated user:
// - Minimum 3 seconds between consecutive requests (prevents rapid double-clicks)
// - Maximum 6 requests per 60-second window (prevents script-based quota exhaustion)
func (h *AIHandler) allowRequest(userID string) (bool, string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	now := time.Now()
	entry, exists := h.limits[userID]
	if !exists {
		h.limits[userID] = &userRateLimit{
			lastRequest: now,
			count:       1,
			windowStart: now,
		}
		return true, ""
	}

	// Fast-click cooldown: at least 3 seconds between requests
	if now.Sub(entry.lastRequest) < 3*time.Second {
		return false, "Please wait a few seconds before requesting another summary."
	}

	// 60-second window reset
	if now.Sub(entry.windowStart) > 60*time.Second {
		entry.windowStart = now
		entry.count = 1
		entry.lastRequest = now
		return true, ""
	}

	// Max 6 requests per 60s
	if entry.count >= 6 {
		return false, "Rate limit reached (max 6 summaries per minute). Please wait a moment before trying again."
	}

	entry.count++
	entry.lastRequest = now
	return true, ""
}

// PostSynthesize handles POST /api/ai/synthesize
// Requires authenticated session. Accepts JSON body with journals, achievements, period, and optional focusArea.
func (h *AIHandler) PostSynthesize(ctx *gin.Context) {
	// 1. Request Body Size Limit (1 MB) to prevent memory exhaustion DoS
	ctx.Request.Body = http.MaxBytesReader(ctx.Writer, ctx.Request.Body, 1<<20)

	// 2. Per-user Rate Limiting & Abuse Prevention
	userID := ctx.GetString("user_id")
	if userID != "" {
		if allowed, reason := h.allowRequest(userID); !allowed {
			ctx.JSON(http.StatusTooManyRequests, gin.H{
				"error": reason,
			})
			return
		}
	}

	// 3. Bind & Parse JSON Body
	var req service.SynthesisRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request payload or body exceeds 1MB limit.",
		})
		return
	}

	// 4. Payload Bound Checks
	if len(req.Journals) > 200 {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Too many journal entries (maximum allowed is 200).",
		})
		return
	}
	if len(req.Achievements) > 100 {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Too many achievements (maximum allowed is 100).",
		})
		return
	}
	if len(req.FocusArea) > 1000 {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Focus question exceeds maximum allowed length of 1,000 characters.",
		})
		return
	}
	if len(req.Language) > 30 {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Language identifier exceeds maximum allowed length of 30 characters.",
		})
		return
	}

	// 5. Extract custom API Key from header if provided (BYOK)
	customApiKey := strings.TrimSpace(ctx.GetHeader("X-Gemini-Api-Key"))

	// 6. Generate synthesis via service
	result, err := h.aiService.GenerateSynthesis(ctx.Request.Context(), req, customApiKey)
	if err != nil {
		// Log full error internally for operational diagnostics (never log custom key)
		log.Printf("[AI Synthesis Error] userID=%s hasCustomKey=%t: %v", userID, customApiKey != "", err)

		// If it's a configuration or key validation error, return informative 400 Bad Request
		errStr := err.Error()
		if strings.Contains(errStr, "Gemini API key") || strings.Contains(errStr, "invalid custom") {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": errStr,
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate review summary. Please verify your Gemini API key or try again later.",
		})
		return
	}

	ctx.JSON(http.StatusOK, result)
}
