package repository

import (
	"context"
	"errors"
	"time"

	"journal_app/internal/db"
	"journal_app/internal/helper"

	"github.com/jackc/pgx/v5/pgtype"
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
	visibility string,
	entryDate string) (db.Journal, error) {

	// Gin stores context keys as strings via ctx.Set("user_id", value).
	userID, ok := ctx.Value(string(userIDKey)).(string)
	if !ok || userID == "" {
		return db.Journal{}, ErrUnauthorizedContext
	}

	UserID, err := helper.ParseID(userID)
	if err != nil {
		return db.Journal{}, err
	}

	journalCategory := db.NullJournalCategory{
		JournalCategory: db.JournalCategory(category),
		Valid:           true,
	}

	journalVisibility := db.NullJournalVisibility{
		JournalVisibility: db.JournalVisibility(visibility),
		Valid:             true,
	}

	kpiPeriod, err := s.queries.GetActiveKPIByUser(ctx, UserID)
	var kpiPeriodID pgtype.Int4
	if err != nil {
		// It's acceptable for a user not to have an active KPI period.
		// If another error occurs, we still want to log/return it. Wait, the exact error check
		// might require importing pgx, but since pgx.ErrNoRows stringifies to "no rows in result set",
		// we can check err.Error() or just assume no active KPI period means it's null.
		// Let's set it to invalid if any error (which usually is no rows).
		// Wait, better yet, we just leave it invalid and continue.
		kpiPeriodID = pgtype.Int4{Valid: false}
	} else {
		kpiPeriodID, err = IntToPgInt4(int(kpiPeriod.ID))
		if err != nil {
			return db.Journal{}, err
		}
	}

	// Determine entry date: use provided date or default to today
	var pgEntryDate pgtype.Date
	if entryDate != "" {
		parsed, parseErr := time.Parse("2006-01-02", entryDate)
		if parseErr != nil {
			return db.Journal{}, errors.New("invalid entry_date format, expected YYYY-MM-DD")
		}
		pgEntryDate = TimeToPgDate(parsed)
	} else {
		pgEntryDate = TimeToPgDate(time.Now())
	}

	journalParams := db.CreateJournalParams{
		UserID:       UserID,
		EntryDate:    pgEntryDate,
		Title:        StringToPgText(title),
		DidToday:     StringToPgText(didToday),
		LearnedToday: StringToPgText(learnedToday),
		Category:     journalCategory,
		Blockers:     StringToPgText(blockers),
		NextPlan:     StringToPgText(nextPlan),
		Visibility:   journalVisibility,
		KpiPeriodID:  kpiPeriodID,
	}

	journal, err := s.queries.CreateJournal(ctx, journalParams)
	return journal, err
}

func (s *JournalRepository) Update(
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
	userID, err := extractUserID(ctx)
	if err != nil {
		return db.Journal{}, err
	}

	return s.queries.UpdateJournal(ctx, db.UpdateJournalParams{
		ID:           id,
		UserID:       userID,
		Title:        StringToNullablePgText(title),
		DidToday:     StringToNullablePgText(didToday),
		LearnedToday: StringToNullablePgText(learnedToday),
		Category:     StringToNullJournalCategory(category),
		Blockers:     StringToNullablePgText(blockers),
		NextPlan:     StringToNullablePgText(nextPlan),
		Visibility:   StringToNullJournalVisibility(visibility),
	})
}

func (s *JournalRepository) SoftDelete(ctx context.Context, id int32) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return err
	}

	return s.queries.SoftDeleteJournal(ctx, db.SoftDeleteJournalParams{
		ID:     id,
		UserID: userID,
	})
}
