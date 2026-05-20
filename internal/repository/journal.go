package repository

import (
	"context"
	"errors"
	"time"

	"journal_app/internal/db"
	"journal_app/internal/helper"
)

type contextKey string

const userIDKey contextKey = "user_id"

var ErrUnauthorizedContext = errors.New("unauthorized: missing user_id in context")

type JournalRepository struct {
	queries *db.Queries
}

func NewJournalRepository(queries *db.Queries) *JournalRepository {
	return &JournalRepository{queries: queries}
}

func (s *JournalRepository) Create(
	ctx context.Context,
	title string,
	didToday string,
	learnedToday string,
	category string,
	blockers string,
	nextPlan string,
	tasksCompleted int,
	hoursCoded float64,
	moodScore int) (db.Journal, error) {

	// Gin stores context keys as strings via ctx.Set("user_id", value).
	userID, ok := ctx.Value(string(userIDKey)).(string)
	if !ok || userID == "" {
		return db.Journal{}, ErrUnauthorizedContext
	}

	UserID, err := helper.ParseID(userID)
	if err != nil {
		return db.Journal{}, err
	}

	tasksCompletedInt4, err := IntToPgInt4(tasksCompleted)
	if err != nil {
		return db.Journal{}, err
	}

	journalCategory := db.NullJournalCategory{
		JournalCategory: db.JournalCategory(category),
		Valid:           true,
	}

	hoursWorkedNumeric, err := Float64ToPgNumeric(hoursCoded)
	if err != nil {
		return db.Journal{}, err
	}

	journalParams := db.CreateJournalParams{
		UserID:         UserID,
		EntryDate:      TimeToPgDate(time.Now()),
		Title:          StringToPgText(title),
		DidToday:       StringToPgText(didToday),
		LearnedToday:   StringToPgText(learnedToday),
		Category:       journalCategory,
		Blockers:       StringToPgText(blockers),
		NextPlan:       StringToPgText(nextPlan),
		TasksCompleted: tasksCompletedInt4,
		HoursWorked:    hoursWorkedNumeric,
	}

	journal, err := s.queries.CreateJournal(ctx, journalParams)
	return journal, err
}
