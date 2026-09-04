package handler

import (
	"errors"
	"net/http"
	"strconv"

	"journal_app/internal/db"
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
	JournalID    int32   `json:"journal_id" form:"journal_id"`
	JournalIDs   []int32 `json:"journal_ids" form:"journal_ids"`
	Title        string  `json:"title" form:"title"`
	Description  string  `json:"description" form:"description"`
	Impact       string  `json:"impact" form:"impact"`
	Importance   string  `json:"importance" form:"importance"`
	AchievedDate string  `json:"achieved_date" form:"achieved_date"`
}

func (h *AchievementHandler) CreateAchievement(ctx *gin.Context) {
	var req createAchievementRequest

	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	achievement, err := h.achievementService.Create(
		ctx, req.JournalID, req.JournalIDs, req.Title, req.Description,
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

	journals, _ := h.achievementService.GetJournalsByAchievement(ctx, int32(id))
	if journals == nil {
		journals = []db.Journal{}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"achievement": achievement,
		"journals":    journals,
	})
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

	// Fetch linked journals for achievements to enrich each achievement without N+1
	links, _ := h.achievementService.GetAchievementJournalsByUser(ctx)
	linksByAch := make(map[int32][]gin.H)
	for _, l := range links {
		linksByAch[l.AchievementID] = append(linksByAch[l.AchievementID], gin.H{
			"id":         l.JournalID,
			"title":      l.Title,
			"entry_date": l.EntryDate,
			"category":   l.Category,
		})
	}

	type enrichedAchievement struct {
		db.Achievement
		LinkedJournals []gin.H `json:"linked_journals"`
	}

	enriched := make([]enrichedAchievement, len(achievements))
	for i, a := range achievements {
		jList := linksByAch[a.ID]
		if jList == nil {
			jList = []gin.H{}
		}
		enriched[i] = enrichedAchievement{
			Achievement:    a,
			LinkedJournals: jList,
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"achievements": enriched})
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

func (h *AchievementHandler) GetJournalsByAchievement(ctx *gin.Context) {
	idStr := ctx.Param("id")
	achievementID, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid achievement ID"})
		return
	}

	journals, err := h.achievementService.GetJournalsByAchievement(ctx, int32(achievementID))
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get journals for achievement", "error": err.Error()})
		return
	}

	if journals == nil {
		journals = []db.Journal{}
	}

	ctx.JSON(http.StatusOK, gin.H{"journals": journals})
}

type linkJournalRequest struct {
	JournalID  int32   `json:"journal_id" form:"journal_id"`
	JournalIDs []int32 `json:"journal_ids" form:"journal_ids"`
}

func (h *AchievementHandler) LinkJournalToAchievement(ctx *gin.Context) {
	idStr := ctx.Param("id")
	achievementID, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid achievement ID"})
		return
	}

	var req linkJournalRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	var targets []int32
	if req.JournalID > 0 {
		targets = append(targets, req.JournalID)
	}
	for _, jid := range req.JournalIDs {
		if jid > 0 && jid != req.JournalID {
			targets = append(targets, jid)
		}
	}

	if len(targets) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "journal_id or journal_ids is required"})
		return
	}

	for _, jid := range targets {
		if err := h.achievementService.LinkJournal(ctx, int32(achievementID), jid); err != nil {
			if errors.Is(err, repository.ErrUnauthorizedContext) {
				ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to link journal to achievement", "error": err.Error()})
			return
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "journal(s) linked to achievement successfully"})
}

func (h *AchievementHandler) UnlinkJournalFromAchievement(ctx *gin.Context) {
	idStr := ctx.Param("id")
	achievementID, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid achievement ID"})
		return
	}

	journalIDStr := ctx.Param("journalId")
	journalID, err := strconv.ParseInt(journalIDStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid journal ID"})
		return
	}

	if err := h.achievementService.UnlinkJournal(ctx, int32(achievementID), int32(journalID)); err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to unlink journal from achievement", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "journal unlinked from achievement successfully"})
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
