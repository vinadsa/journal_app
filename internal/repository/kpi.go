package repository

import (
	"context"
	"time"

	"journal_app/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

type KPIRepository struct {
	queries *db.Queries
}

func NewKPIRepository(queries *db.Queries) *KPIRepository {
	return &KPIRepository{queries: queries}
}

func (r *KPIRepository) Create(ctx context.Context, name string, startDate, endDate time.Time, teamID int32) (db.KpiPeriod, error) {
	var pgTeamID pgtype.Int4
	if teamID > 0 {
		pgTeamID = pgtype.Int4{Int32: teamID, Valid: true}
	}

	return r.queries.CreateKPI(ctx, db.CreateKPIParams{
		Name:      name,
		StartDate: TimeToPgDate(startDate),
		EndDate:   TimeToPgDate(endDate),
		TeamID:    pgTeamID,
	})
}

func (r *KPIRepository) ListForCurrentContext(ctx context.Context) ([]db.KpiPeriod, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}
	return r.queries.GetKPIsByUser(ctx, userID)
}

func (r *KPIRepository) ListByTeam(ctx context.Context, teamID int32) ([]db.KpiPeriod, error) {
	return r.queries.GetKPIsByTeam(ctx, pgtype.Int4{Int32: teamID, Valid: true})
}

func (r *KPIRepository) GetActiveForCurrentContext(ctx context.Context) (db.KpiPeriod, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return db.KpiPeriod{}, err
	}
	return r.queries.GetActiveKPIByUser(ctx, userID)
}

func (r *KPIRepository) GetByID(ctx context.Context, id int32) (db.KpiPeriod, error) {
	return r.queries.GetKPIByID(ctx, id)
}

func (r *KPIRepository) GetByDateAndUser(ctx context.Context, userID int32, date time.Time) (db.KpiPeriod, error) {
	return r.queries.GetKPIByDateAndUser(ctx, db.GetKPIByDateAndUserParams{
		ID:        userID,
		StartDate: TimeToPgDate(date),
	})
}

func (r *KPIRepository) GetCurrentContextTeamID(ctx context.Context) (int32, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return 0, err
	}
	user, err := r.queries.GetUserByID(ctx, userID)
	if err != nil {
		return 0, err
	}
	if !user.TeamID.Valid {
		return 0, nil
	}
	return user.TeamID.Int32, nil
}
