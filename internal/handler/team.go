package handler

import (
	"net/http"
	"strconv"

	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
)

type TeamHandler struct {
	teamService *service.TeamService
}

func NewTeamHandler(teamService *service.TeamService) *TeamHandler {
	return &TeamHandler{teamService: teamService}
}

type createTeamRequest struct {
	Name string `json:"name" form:"name"`
}

func (h *TeamHandler) CreateTeam(ctx *gin.Context) {
	var req createTeamRequest

	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	team, err := h.teamService.CreateTeam(ctx.Request.Context(), req.Name)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create team"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "team created successfully",
		"team":    team,
	})
}

// GetTeamOverview returns aggregated team activity, achievement, and foundation work metrics for calibration
func (h *TeamHandler) GetTeamOverview(ctx *gin.Context) {
	userIDStr := ctx.GetString("user_id")
	if userIDStr == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	overview, err := h.teamService.GetTeamOverview(ctx.Request.Context(), int32(userID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, overview)
}
