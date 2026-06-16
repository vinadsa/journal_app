package service

import (
	"context"

	"journal_app/internal/db"
	"journal_app/internal/repository"
)

type SearchService struct {
	repository *repository.SearchRepository
}

func NewSearchService(repository *repository.SearchRepository) *SearchService {
	return &SearchService{repository: repository}
}

func (s *SearchService) SearchJournals(ctx context.Context, params repository.SearchParams) ([]db.Journal, error) {
	return s.repository.SearchJournals(ctx, params)
}
