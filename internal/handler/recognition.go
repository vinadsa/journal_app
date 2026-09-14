package handler

import (
	"net/http"
	"strconv"

	"journal_app/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type RecognitionHandler struct {
	queries *db.Queries
}

func NewRecognitionHandler(queries *db.Queries) *RecognitionHandler {
	return &RecognitionHandler{queries: queries}
}

type createRecognitionRequest struct {
	TargetUserID int32  `json:"target_user_id" binding:"required"`
	Message      string `json:"message" binding:"required"`
	Pillar       string `json:"pillar"`
	KPIPeriodID  *int32 `json:"kpi_period_id"`
}

// CreateRecognition allows a manager to send a foundation work recognition message to a team member
func (h *RecognitionHandler) CreateRecognition(ctx *gin.Context) {
	managerIDStr := ctx.GetString("user_id")
	if managerIDStr == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	managerID, err := strconv.Atoi(managerIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	var req createRecognitionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body", "error": err.Error()})
		return
	}

	kpiPeriodID := pgtype.Int4{}
	if req.KPIPeriodID != nil {
		kpiPeriodID = pgtype.Int4{Int32: *req.KPIPeriodID, Valid: true}
	}

	pillar := pgtype.Text{}
	if req.Pillar != "" {
		pillar = pgtype.Text{String: req.Pillar, Valid: true}
	}

	recognition, err := h.queries.CreateRecognition(ctx.Request.Context(), db.CreateRecognitionParams{
		ManagerID:    int32(managerID),
		TargetUserID: req.TargetUserID,
		Message:      req.Message,
		Pillar:       pillar,
		KpiPeriodID:  kpiPeriodID,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create recognition", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message":     "recognition created",
		"recognition": recognition,
	})
}

// GetMyRecognitions retrieves all recognitions received by the authenticated user
func (h *RecognitionHandler) GetMyRecognitions(ctx *gin.Context) {
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

	recognitions, err := h.queries.GetRecognitionsByTargetUser(ctx.Request.Context(), int32(userID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to fetch recognitions", "error": err.Error()})
		return
	}

	if recognitions == nil {
		recognitions = []db.GetRecognitionsByTargetUserRow{}
	}

	ctx.JSON(http.StatusOK, gin.H{"recognitions": recognitions})
}
