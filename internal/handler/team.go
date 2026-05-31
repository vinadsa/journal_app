package handler

import (
	"net/http"

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
