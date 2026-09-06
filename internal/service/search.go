package service

import (
	"context"

	"journal_app/internal/repository"
)

type SearchService struct {
	repository *repository.SearchRepository
}

func NewSearchService(repository *repository.SearchRepository) *SearchService {
	return &SearchService{repository: repository}
}

func (s *SearchService) SearchJournals(ctx context.Context, params repository.SearchParams) ([]repository.EnrichedJournal, error) {
	return s.repository.SearchJournals(ctx, params)
}

func (s *SearchService) SearchAchievements(ctx context.Context, params repository.SearchAchievementParams) ([]repository.EnrichedAchievement, error) {
	return s.repository.SearchAchievements(ctx, params)
}

