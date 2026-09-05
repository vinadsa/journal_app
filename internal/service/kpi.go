package service

import (
	"context"
	"errors"
	"time"

	"journal_app/internal/db"
	"journal_app/internal/repository"
)

var (
	ErrKPINameRequired      = errors.New("name is required")
	ErrKPIStartDateRequired = errors.New("start_date is required")
	ErrKPIEndDateRequired   = errors.New("end_date is required")
	ErrKPIInvalidDates      = errors.New("start_date must be before or equal to end_date")
	ErrKPINoTeam            = errors.New("user does not belong to any team")
	ErrKPINotFound          = errors.New("kpi period not found")
)

type KPIPeriodDTO struct {
	ID        int32     `json:"id"`
	Name      string    `json:"name"`
	StartDate string    `json:"start_date"`
	EndDate   string    `json:"end_date"`
	TeamID    *int32    `json:"team_id,omitempty"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type KPIService struct {
	repo *repository.KPIRepository
}

func NewKPIService(repo *repository.KPIRepository) *KPIService {
	return &KPIService{
		repo: repo,
	}
}

func formatKPIDTO(kp db.KpiPeriod) KPIPeriodDTO {
	var teamID *int32
	if kp.TeamID.Valid {
		tid := kp.TeamID.Int32
		teamID = &tid
	}

	startStr := kp.StartDate.Time.Format("2006-01-02")
	endStr := kp.EndDate.Time.Format("2006-01-02")

	now := time.Now().UTC()
	nowDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	sDate := time.Date(kp.StartDate.Time.Year(), kp.StartDate.Time.Month(), kp.StartDate.Time.Day(), 0, 0, 0, 0, time.UTC)
	eDate := time.Date(kp.EndDate.Time.Year(), kp.EndDate.Time.Month(), kp.EndDate.Time.Day(), 23, 59, 59, 999, time.UTC)

	isActive := (nowDate.Equal(sDate) || nowDate.After(sDate)) && (nowDate.Equal(eDate) || nowDate.Before(eDate))

	var createdAt time.Time
	if kp.CreatedAt.Valid {
		createdAt = kp.CreatedAt.Time
	}

	return KPIPeriodDTO{
		ID:        kp.ID,
		Name:      kp.Name,
		StartDate: startStr,
		EndDate:   endStr,
		TeamID:    teamID,
		IsActive:  isActive,
		CreatedAt: createdAt,
	}
}

func (s *KPIService) CreateKPIPeriod(ctx context.Context, name, startDateStr, endDateStr string, teamID *int32) (KPIPeriodDTO, error) {
	if name == "" {
		return KPIPeriodDTO{}, ErrKPINameRequired
	}
	if startDateStr == "" {
		return KPIPeriodDTO{}, ErrKPIStartDateRequired
	}
	if endDateStr == "" {
		return KPIPeriodDTO{}, ErrKPIEndDateRequired
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		return KPIPeriodDTO{}, errors.New("invalid start_date format, expected YYYY-MM-DD")
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		return KPIPeriodDTO{}, errors.New("invalid end_date format, expected YYYY-MM-DD")
	}

	if startDate.After(endDate) {
		return KPIPeriodDTO{}, ErrKPIInvalidDates
	}

	var finalTeamID int32
	if teamID != nil && *teamID > 0 {
		finalTeamID = *teamID
	} else {
		userTeamID, tErr := s.repo.GetCurrentContextTeamID(ctx)
		if tErr != nil {
			return KPIPeriodDTO{}, tErr
		}
		if userTeamID == 0 {
			return KPIPeriodDTO{}, ErrKPINoTeam
		}
		finalTeamID = userTeamID
	}

	kp, err := s.repo.Create(ctx, name, startDate, endDate, finalTeamID)
	if err != nil {
		return KPIPeriodDTO{}, err
	}

	return formatKPIDTO(kp), nil
}

func (s *KPIService) ListKPIPeriods(ctx context.Context) ([]KPIPeriodDTO, error) {
	periods, err := s.repo.ListForCurrentContext(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]KPIPeriodDTO, 0, len(periods))
	for _, p := range periods {
		result = append(result, formatKPIDTO(p))
	}
	return result, nil
}

func (s *KPIService) GetActiveKPIPeriod(ctx context.Context) (*KPIPeriodDTO, error) {
	kp, err := s.repo.GetActiveForCurrentContext(ctx)
	if err != nil {
		return nil, err
	}
	dto := formatKPIDTO(kp)
	return &dto, nil
}

func (s *KPIService) GetKPIPeriod(ctx context.Context, id int32) (KPIPeriodDTO, error) {
	kp, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return KPIPeriodDTO{}, err
	}
	return formatKPIDTO(kp), nil
}
