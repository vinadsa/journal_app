package handler

import (
	"errors"
	"net/http"
	"strings"

	"journal_app/internal/middleware"
	"journal_app/internal/repository"
	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
)

type JournalHandler struct {
	journalService *service.JournalService
	authMW         *middleware.AuthMiddleware
}

func NewJournalHandler(journalService *service.JournalService) *JournalHandler {
	return &JournalHandler{
		journalService: journalService,
	}
}

type createJournalRequest struct {
	Title          string  `json:"title" form:"title"`
	DidToday       string  `json:"did_today" form:"did_today"`
	LearnedToday   string  `json:"learned_today" form:"learned_today"`
	Category       string  `json:"category" form:"category"`
	Blockers       string  `json:"blockers" form:"blockers"`
	NextPlan       string  `json:"next_plan" form:"next_plan"`
	TasksCompleted int     `json:"tasks_completed" form:"tasks_completed"`
	HoursCoded     float64 `json:"hours_coded" form:"hours_coded"`
	MoodScore      int     `json:"mood_score" form:"mood_score"`
}

func (h *JournalHandler) CreateJournal(ctx *gin.Context) {
	var req createJournalRequest

	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	if req.Title == "" || req.DidToday == "" || req.Category == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "title, did_today, and category are required"})
		return
	}

	journal, err := h.journalService.CreateJournal(ctx, req.Title, req.DidToday, req.LearnedToday, req.Category, req.Blockers, req.NextPlan, int(req.TasksCompleted), req.HoursCoded, req.MoodScore)
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
			"error": err.Error(),})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "journal entry created successfully", "journal": journal})
}
