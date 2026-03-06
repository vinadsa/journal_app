package service

import (
	"context"

	"journal_app/internal/db"
	"journal_app/internal/repository"
)

type JournalService struct {
	repository *repository.JournalRepository
}

func NewJournalService(repository *repository.JournalRepository) *JournalService {
	return &JournalService{repository: repository}
}

func (s *JournalService) CreateJournal(ctx context.Context, title string, didToday string, learnedToday string, category string, blockers string, nextPlan string, tasksCompleted int, hoursCoded float64, moodScore int) (db.Journal, error) {
	journal, err := s.repository.Create(ctx, title, didToday, learnedToday, category, blockers, nextPlan, tasksCompleted, hoursCoded, moodScore)
	return journal, err
}
