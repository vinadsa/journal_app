package handler

import (
	"net/http"
	"strconv"

	"journal_app/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type CalibrationHandler struct {
	queries *db.Queries
}

func NewCalibrationHandler(queries *db.Queries) *CalibrationHandler {
	return &CalibrationHandler{queries: queries}
}

type upsertCalibrationNoteRequest struct {
	TargetUserID int32  `json:"target_user_id" binding:"required"`
	KPIPeriodID  *int32 `json:"kpi_period_id"`
	Note         string `json:"note" binding:"required"`
}

// UpsertCalibrationNote creates or updates a manager's calibration note for a team member
// in a specific KPI period. Uses ON CONFLICT upsert semantics.
func (h *CalibrationHandler) UpsertCalibrationNote(ctx *gin.Context) {
	userIDStr := ctx.GetString("user_id")
	if userIDStr == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	managerID, err := strconv.Atoi(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	var req upsertCalibrationNoteRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body", "error": err.Error()})
		return
	}

	kpiPeriodID := pgtype.Int4{}
	if req.KPIPeriodID != nil {
		kpiPeriodID = pgtype.Int4{Int32: *req.KPIPeriodID, Valid: true}
	}

	note, err := h.queries.UpsertCalibrationNote(ctx.Request.Context(), db.UpsertCalibrationNoteParams{
		ManagerID:    int32(managerID),
		TargetUserID: req.TargetUserID,
		KpiPeriodID:  kpiPeriodID,
		Note:         req.Note,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to save calibration note", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "note saved",
		"note":    note,
	})
}

// GetCalibrationNotes retrieves all calibration notes for the authenticated manager,
// optionally filtered by KPI period.
func (h *CalibrationHandler) GetCalibrationNotes(ctx *gin.Context) {
	userIDStr := ctx.GetString("user_id")
	if userIDStr == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	managerID, err := strconv.Atoi(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	var kpiPeriodID int32
	if kpiStr := ctx.Query("kpi_period_id"); kpiStr != "" {
		kpiID, err := strconv.Atoi(kpiStr)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid kpi_period_id"})
			return
		}
		kpiPeriodID = int32(kpiID)
	}

	notes, err := h.queries.GetCalibrationNotesByManager(ctx.Request.Context(), db.GetCalibrationNotesByManagerParams{
		ManagerID:   int32(managerID),
		KpiPeriodID: kpiPeriodID,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to fetch calibration notes", "error": err.Error()})
		return
	}

	if notes == nil {
		notes = []db.GetCalibrationNotesByManagerRow{}
	}

	ctx.JSON(http.StatusOK, gin.H{"notes": notes})
}

// DeleteCalibrationNote deletes a calibration note, enforcing manager ownership.
func (h *CalibrationHandler) DeleteCalibrationNote(ctx *gin.Context) {
	userIDStr := ctx.GetString("user_id")
	if userIDStr == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	managerID, err := strconv.Atoi(userIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	noteIDStr := ctx.Param("id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid note id"})
		return
	}

	err = h.queries.DeleteCalibrationNote(ctx.Request.Context(), db.DeleteCalibrationNoteParams{
		ID:        int32(noteID),
		ManagerID: int32(managerID),
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete calibration note", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "note deleted"})
}
