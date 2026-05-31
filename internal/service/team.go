package service

import (
	"context"

	"journal_app/internal/db"
)

type TeamService struct {
	queries *db.Queries
}

func NewTeamService(queries *db.Queries) *TeamService {
	return &TeamService{queries: queries}
}

func (s *TeamService) CreateTeam(ctx context.Context, name string) (db.Team, error) {
	return s.queries.CreateTeam(ctx, name)
}
