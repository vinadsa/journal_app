package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// clientTracker tracks token bucket rate limiting state per client IP
type clientTracker struct {
	tokens     float64
	lastRefill time.Time
	mu         sync.Mutex
}

// RateLimiter manages in-memory rate limiting with automatic idle cleanup
type RateLimiter struct {
	mu            sync.RWMutex
	clients       map[string]*clientTracker
	capacity      float64       // Max burst tokens
	refillRate    float64       // Tokens added per second
	cleanupTicker *time.Ticker
	stopCleanup   chan struct{}
}

// NewRateLimiter initializes a token-bucket rate limiter
func NewRateLimiter(capacity float64, refillInterval time.Duration) *RateLimiter {
	refillRate := capacity / refillInterval.Seconds()
	limiter := &RateLimiter{
		clients:       make(map[string]*clientTracker),
		capacity:      capacity,
		refillRate:    refillRate,
		cleanupTicker: time.NewTicker(10 * time.Minute),
		stopCleanup:   make(chan struct{}),
	}

	// Prune inactive clients every 10 minutes to prevent memory leak
	go func() {
		for {
			select {
			case <-limiter.cleanupTicker.C:
				limiter.pruneClients(15 * time.Minute)
			case <-limiter.stopCleanup:
				limiter.cleanupTicker.Stop()
				return
			}
		}
	}()

	return limiter
}

func (rl *RateLimiter) pruneClients(maxAge time.Duration) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	for ip, client := range rl.clients {
		client.mu.Lock()
		if now.Sub(client.lastRefill) > maxAge {
			delete(rl.clients, ip)
		}
		client.mu.Unlock()
	}
}

func (rl *RateLimiter) getClient(ip string) *clientTracker {
	rl.mu.RLock()
	client, exists := rl.clients[ip]
	rl.mu.RUnlock()

	if exists {
		return client
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Double check after acquiring write lock
	if client, exists = rl.clients[ip]; exists {
		return client
	}

	client = &clientTracker{
		tokens:     rl.capacity,
		lastRefill: time.Now(),
	}
	rl.clients[ip] = client
	return client
}

func (rl *RateLimiter) allow(ip string) (bool, time.Duration) {
	client := rl.getClient(ip)
	client.mu.Lock()
	defer client.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(client.lastRefill).Seconds()
	client.lastRefill = now

	// Refill tokens
	client.tokens += elapsed * rl.refillRate
	if client.tokens > rl.capacity {
		client.tokens = rl.capacity
	}

	if client.tokens >= 1.0 {
		client.tokens -= 1.0
		return true, 0
	}

	// Calculate wait time until at least 1 token is available
	missing := 1.0 - client.tokens
	retryAfter := time.Duration(missing/rl.refillRate) * time.Second
	if retryAfter < time.Second {
		retryAfter = time.Second
	}

	return false, retryAfter
}

// RateLimitAuth creates a rate limiter for sensitive authentication endpoints (5 req/min per IP)
func RateLimitAuth() gin.HandlerFunc {
	limiter := NewRateLimiter(5, 1*time.Minute)
	return func(ctx *gin.Context) {
		clientIP := ctx.ClientIP()
		allowed, retryAfter := limiter.allow(clientIP)
		if !allowed {
			seconds := int(retryAfter.Seconds())
			if seconds <= 0 {
				seconds = 1
			}
			ctx.Header("Retry-After", time.Duration(seconds*int(time.Second)).String())
			ctx.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message":             "Too many requests. Please wait a moment before trying again.",
				"retry_after_seconds": seconds,
			})
			return
		}
		ctx.Next()
	}
}

// RateLimitGeneral creates a rate limiter for general API endpoints (100 req/min per IP)
func RateLimitGeneral() gin.HandlerFunc {
	limiter := NewRateLimiter(100, 1*time.Minute)
	return func(ctx *gin.Context) {
		clientIP := ctx.ClientIP()
		allowed, retryAfter := limiter.allow(clientIP)
		if !allowed {
			seconds := int(retryAfter.Seconds())
			if seconds <= 0 {
				seconds = 1
			}
			ctx.Header("Retry-After", time.Duration(seconds*int(time.Second)).String())
			ctx.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message":             "Too many requests. Please slow down.",
				"retry_after_seconds": seconds,
			})
			return
		}
		ctx.Next()
	}
}
