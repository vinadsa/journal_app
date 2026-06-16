package service

import (
	"context"
	"errors"

	"journal_app/internal/db"
	"journal_app/internal/repository"
)

var (
	ErrJournalTitleRequired    = errors.New("title is required")
	ErrJournalDidTodayRequired = errors.New("did_today is required")
	ErrJournalCategoryRequired = errors.New("category is required")
)

type JournalService struct {
	repository *repository.JournalRepository
}

func NewJournalService(repository *repository.JournalRepository) *JournalService {
	return &JournalService{repository: repository}
}

func (s *JournalService) CreateJournal(
	ctx context.Context,
	title string,
	didToday string,
	learnedToday string,
	category string,
	blockers string,
	nextPlan string,
	visibility string,
) (db.Journal, error) {
	journal, err := s.repository.Create(ctx, title, didToday, learnedToday, category, blockers, nextPlan, visibility)
	return journal, err
}

func (s *JournalService) UpdateJournal(
	ctx context.Context,
	id int32,
	title string,
	didToday string,
	learnedToday string,
	category string,
	blockers string,
	nextPlan string,
	visibility string,
) (db.Journal, error) {
	return s.repository.Update(ctx, id, title, didToday, learnedToday, category, blockers, nextPlan, visibility)
}

func (s *JournalService) DeleteJournal(ctx context.Context, id int32) error {
	return s.repository.SoftDelete(ctx, id)
}

