package handler

import (
	"errors"
	"net/http"
	"strconv"

	"journal_app/internal/repository"
	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
)

type AchievementHandler struct {
	achievementService *service.AchievementService
}

func NewAchievementHandler(achievementService *service.AchievementService) *AchievementHandler {
	return &AchievementHandler{achievementService: achievementService}
}

type createAchievementRequest struct {
	JournalID    int32  `json:"journal_id" form:"journal_id"`
	Title        string `json:"title" form:"title"`
	Description  string `json:"description" form:"description"`
	Impact       string `json:"impact" form:"impact"`
	Importance   string `json:"importance" form:"importance"`
	AchievedDate string `json:"achieved_date" form:"achieved_date"`
}

func (h *AchievementHandler) CreateAchievement(ctx *gin.Context) {
	var req createAchievementRequest

	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	achievement, err := h.achievementService.Create(
		ctx, req.JournalID, req.Title, req.Description,
		req.Impact, req.Importance, req.AchievedDate,
	)
	if err != nil {
		if errors.Is(err, service.ErrAchievementTitleRequired) || errors.Is(err, service.ErrAchievementJournalRequired) {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create achievement", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "achievement created successfully", "achievement": achievement})
}

func (h *AchievementHandler) GetAchievement(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid achievement ID"})
		return
	}

	achievement, err := h.achievementService.GetByID(ctx, int32(id))
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusNotFound, gin.H{"message": "achievement not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"achievement": achievement})
}

func (h *AchievementHandler) ListAchievements(ctx *gin.Context) {
	limitStr := ctx.DefaultQuery("limit", "20")
	offsetStr := ctx.DefaultQuery("offset", "0")

	limit, _ := strconv.ParseInt(limitStr, 10, 32)
	offset, _ := strconv.ParseInt(offsetStr, 10, 32)

	achievements, err := h.achievementService.GetByUserPaginated(ctx, int32(limit), int32(offset))
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list achievements", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"achievements": achievements})
}

func (h *AchievementHandler) GetAchievementsByJournal(ctx *gin.Context) {
	idStr := ctx.Param("id")
	journalID, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid journal ID"})
		return
	}

	achievements, err := h.achievementService.GetByJournal(ctx, int32(journalID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get achievements", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"achievements": achievements})
}

type updateAchievementRequest struct {
	Title        string `json:"title" form:"title"`
	Description  string `json:"description" form:"description"`
	Impact       string `json:"impact" form:"impact"`
	Importance   string `json:"importance" form:"importance"`
	AchievedDate string `json:"achieved_date" form:"achieved_date"`
}

func (h *AchievementHandler) UpdateAchievement(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid achievement ID"})
		return
	}

	var req updateAchievementRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	achievement, err := h.achievementService.Update(
		ctx, int32(id), req.Title, req.Description,
		req.Impact, req.Importance, req.AchievedDate,
	)
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update achievement", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "achievement updated successfully", "achievement": achievement})
}

func (h *AchievementHandler) DeleteAchievement(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid achievement ID"})
		return
	}

	if err := h.achievementService.Delete(ctx, int32(id)); err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete achievement", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "achievement deleted successfully"})
}
