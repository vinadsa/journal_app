package handler

import (
	"errors"
	"net/http"
	"strconv"

	"journal_app/internal/repository"
	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
)

type KPIHandler struct {
	kpiService *service.KPIService
}

func NewKPIHandler(kpiService *service.KPIService) *KPIHandler {
	return &KPIHandler{
		kpiService: kpiService,
	}
}

type createKPIPeriodRequest struct {
	Name      string `json:"name" form:"name" binding:"required"`
	StartDate string `json:"start_date" form:"start_date" binding:"required"`
	EndDate   string `json:"end_date" form:"end_date" binding:"required"`
	TeamID    *int32 `json:"team_id" form:"team_id"`
}

func (h *KPIHandler) CreateKPIPeriod(ctx *gin.Context) {
	var req createKPIPeriodRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body", "error": err.Error()})
		return
	}

	period, err := h.kpiService.CreateKPIPeriod(ctx, req.Name, req.StartDate, req.EndDate, req.TeamID)
	if err != nil {
		if errors.Is(err, service.ErrKPINameRequired) ||
			errors.Is(err, service.ErrKPIStartDateRequired) ||
			errors.Is(err, service.ErrKPIEndDateRequired) ||
			errors.Is(err, service.ErrKPIInvalidDates) {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		if errors.Is(err, service.ErrKPINoTeam) {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": "user is not assigned to any team"})
			return
		}
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create KPI period", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message":    "KPI period created successfully",
		"kpi_period": period,
	})
}

func (h *KPIHandler) ListKPIPeriods(ctx *gin.Context) {
	periods, err := h.kpiService.ListKPIPeriods(ctx)
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list KPI periods", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"kpi_periods": periods,
	})
}

func (h *KPIHandler) GetActiveKPIPeriod(ctx *gin.Context) {
	period, err := h.kpiService.GetActiveKPIPeriod(ctx)
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		// When no active period is found (e.g. pgx no rows), return null gracefully
		ctx.JSON(http.StatusOK, gin.H{
			"active_kpi_period": nil,
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"active_kpi_period": period,
	})
}

func (h *KPIHandler) GetKPIPeriod(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid KPI period ID"})
		return
	}

	period, err := h.kpiService.GetKPIPeriod(ctx, int32(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"message": "KPI period not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"kpi_period": period,
	})
}
