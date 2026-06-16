package handler

import (
	"journal_app/internal/service"
)

type KPIHandler struct {
	kpiService *service.KPIService
}

func NewKPIHandler(kpiService *service.KPIService) *KPIHandler {
	return &KPIHandler{
		kpiService: kpiService,
	}
}
