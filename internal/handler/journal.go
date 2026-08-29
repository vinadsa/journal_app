package handler

import (
	"errors"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"journal_app/internal/repository"
	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
)

type JournalHandler struct {
	journalService *service.JournalService
}

func NewJournalHandler(journalService *service.JournalService) *JournalHandler {
	return &JournalHandler{
		journalService: journalService,
	}
}

type createJournalRequest struct {
	Title        string `json:"title" form:"title"`
	DidToday     string `json:"did_today" form:"did_today"`
	LearnedToday string `json:"learned_today" form:"learned_today"`
	Category     string `json:"category" form:"category"`
	Blockers     string `json:"blockers" form:"blockers"`
	NextPlan     string `json:"next_plan" form:"next_plan"`
	Visibility   string `json:"visibility" form:"visibility" binding:"required,oneof=public private team manager_only"`
	EntryDate    string `json:"entry_date" form:"entry_date"`
}

func (h *JournalHandler) CreateJournal(ctx *gin.Context) {
	// Parse multipart form with 50MB max memory to be safe (5 files * 10MB)
	err := ctx.Request.ParseMultipartForm(50 << 20)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "failed to parse multipart form"})
		return
	}

	var req createJournalRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	if req.Title == "" || req.DidToday == "" || req.Category == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "title, did_today, and category are required"})
		return
	}

	// Handle attachments
	form, _ := ctx.MultipartForm()
	var attachments []*multipart.FileHeader
	if form != nil && form.File != nil {
		files := form.File["attachments"]
		if len(files) > 5 {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": "maximum of 5 attachments allowed"})
			return
		}
		for _, file := range files {
			// Size limit: 10MB
			if file.Size > 10*1024*1024 {
				ctx.JSON(http.StatusBadRequest, gin.H{"message": "file size exceeds 10MB limit"})
				return
			}
			// Image only validation
			contentType := file.Header.Get("Content-Type")
			if !strings.HasPrefix(contentType, "image/") {
				ctx.JSON(http.StatusBadRequest, gin.H{"message": "only image files are allowed"})
				return
			}
			attachments = append(attachments, file)
		}
	}

	journal, err := h.journalService.CreateJournal(
		ctx,
		req.Title,
		req.DidToday,
		req.LearnedToday,
		req.Category,
		req.Blockers,
		req.NextPlan,
		req.Visibility,
		req.EntryDate,
		attachments,
	)
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		if strings.Contains(err.Error(), "invalid input syntax for type uuid") {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid user ID"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create journal entry",
			"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "journal entry created successfully", "journal": journal})
}

type updateJournalRequest struct {
	Title        string `json:"title" form:"title"`
	DidToday     string `json:"did_today" form:"did_today"`
	LearnedToday string `json:"learned_today" form:"learned_today"`
	Category     string `json:"category" form:"category"`
	Blockers     string `json:"blockers" form:"blockers"`
	NextPlan     string `json:"next_plan" form:"next_plan"`
	Visibility   string `json:"visibility" form:"visibility"`
}

func (h *JournalHandler) UpdateJournal(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid journal ID"})
		return
	}

	var req updateJournalRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	journal, err := h.journalService.UpdateJournal(
		ctx,
		int32(id),
		req.Title,
		req.DidToday,
		req.LearnedToday,
		req.Category,
		req.Blockers,
		req.NextPlan,
		req.Visibility,
	)
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		if strings.Contains(err.Error(), "no rows") {
			ctx.JSON(http.StatusNotFound, gin.H{"message": "journal not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update journal entry", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "journal entry updated successfully", "journal": journal})
}

func (h *JournalHandler) DeleteJournal(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid journal ID"})
		return
	}

	if err := h.journalService.DeleteJournal(ctx, int32(id)); err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete journal entry", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "journal entry deleted successfully"})
}

