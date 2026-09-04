package repository

import (
	"context"
	"time"

	"journal_app/internal/db"
	"journal_app/internal/helper"

	"github.com/jackc/pgx/v5/pgtype"
)

type AchievementRepository struct {
	queries *db.Queries
}

func NewAchievementRepository(queries *db.Queries) *AchievementRepository {
	return &AchievementRepository{queries: queries}
}

func (r *AchievementRepository) Create(
	ctx context.Context,
	journalID int32,
	journalIDs []int32,
	title string,
	description string,
	impact string,
	importance string,
	achievedDate string,
) (db.Achievement, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return db.Achievement{}, err
	}

	importanceLevel := db.NullImportanceLevel{}
	if importance != "" {
		importanceLevel = db.NullImportanceLevel{
			ImportanceLevel: db.ImportanceLevel(importance),
			Valid:           true,
		}
	}

	var achievedDatePg pgtype.Date
	if achievedDate != "" {
		t, err := time.Parse("2006-01-02", achievedDate)
		if err != nil {
			return db.Achievement{}, err
		}
		achievedDatePg = TimeToPgDate(t)
	}

	var pgJournalID pgtype.Int4
	if journalID > 0 {
		pgJournalID = pgtype.Int4{Int32: journalID, Valid: true}
	} else if len(journalIDs) > 0 {
		pgJournalID = pgtype.Int4{Int32: journalIDs[0], Valid: true}
	}

	ach, err := r.queries.CreateAchievement(ctx, db.CreateAchievementParams{
		JournalID:    pgJournalID,
		UserID:       userID,
		Title:        title,
		Description:  StringToNullablePgText(description),
		Impact:       StringToNullablePgText(impact),
		Importance:   importanceLevel,
		AchievedDate: achievedDatePg,
	})
	if err != nil {
		return ach, err
	}

	// Link all journals in achievement_journals
	allJournalIDs := make([]int32, 0, len(journalIDs)+1)
	if journalID > 0 {
		allJournalIDs = append(allJournalIDs, journalID)
	}
	for _, jid := range journalIDs {
		if jid > 0 && jid != journalID {
			allJournalIDs = append(allJournalIDs, jid)
		}
	}

	for _, jid := range allJournalIDs {
		_ = r.queries.AddJournalToAchievement(ctx, db.AddJournalToAchievementParams{
			AchievementID: ach.ID,
			JournalID:     jid,
		})
	}

	return ach, nil
}

func (r *AchievementRepository) GetByID(ctx context.Context, id int32) (db.Achievement, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return db.Achievement{}, err
	}

	return r.queries.GetAchievementByID(ctx, db.GetAchievementByIDParams{
		ID:     id,
		UserID: userID,
	})
}

func (r *AchievementRepository) GetByJournal(ctx context.Context, journalID int32) ([]db.Achievement, error) {
	return r.queries.GetAchievementsByJournal(ctx, pgtype.Int4{Int32: journalID, Valid: true})
}

func (r *AchievementRepository) AddJournalToAchievement(ctx context.Context, achievementID, journalID int32) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return err
	}

	// Verify achievement belongs to user
	_, err = r.queries.GetAchievementByID(ctx, db.GetAchievementByIDParams{
		ID:     achievementID,
		UserID: userID,
	})
	if err != nil {
		return err
	}

	// Verify journal belongs to user
	_, err = r.queries.GetJournalByID(ctx, db.GetJournalByIDParams{
		ID:     journalID,
		UserID: userID,
	})
	if err != nil {
		return err
	}

	return r.queries.AddJournalToAchievement(ctx, db.AddJournalToAchievementParams{
		AchievementID: achievementID,
		JournalID:     journalID,
	})
}

func (r *AchievementRepository) RemoveJournalFromAchievement(ctx context.Context, achievementID, journalID int32) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return err
	}

	// Verify achievement belongs to user
	_, err = r.queries.GetAchievementByID(ctx, db.GetAchievementByIDParams{
		ID:     achievementID,
		UserID: userID,
	})
	if err != nil {
		return err
	}

	return r.queries.RemoveJournalFromAchievement(ctx, db.RemoveJournalFromAchievementParams{
		AchievementID: achievementID,
		JournalID:     journalID,
	})
}

func (r *AchievementRepository) GetJournalsByAchievement(ctx context.Context, achievementID int32) ([]db.Journal, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

	// Verify achievement belongs to user
	_, err = r.queries.GetAchievementByID(ctx, db.GetAchievementByIDParams{
		ID:     achievementID,
		UserID: userID,
	})
	if err != nil {
		return nil, err
	}

	return r.queries.GetJournalsByAchievement(ctx, achievementID)
}

func (r *AchievementRepository) GetAchievementJournalsByUser(ctx context.Context) ([]db.GetAchievementJournalsByUserRow, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

	return r.queries.GetAchievementJournalsByUser(ctx, userID)
}

func (r *AchievementRepository) GetByUser(ctx context.Context) ([]db.Achievement, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

	return r.queries.GetAchievementsByUser(ctx, userID)
}

func (r *AchievementRepository) GetByUserPaginated(ctx context.Context, limit, offset int32) ([]db.Achievement, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

	return r.queries.GetAchievementsByUserPaginated(ctx, db.GetAchievementsByUserPaginatedParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
}

func (r *AchievementRepository) GetByDateRange(ctx context.Context, from, to time.Time) ([]db.Achievement, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

	return r.queries.GetAchievementsByDateRange(ctx, db.GetAchievementsByDateRangeParams{
		UserID:       userID,
		AchievedDate: TimeToPgDate(from),
		AchievedDate_2: TimeToPgDate(to),
	})
}

func (r *AchievementRepository) GetByImportance(ctx context.Context, importance string) ([]db.Achievement, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

	return r.queries.GetAchievementsByImportance(ctx, db.GetAchievementsByImportanceParams{
		UserID:     userID,
		Importance: db.NullImportanceLevel{ImportanceLevel: db.ImportanceLevel(importance), Valid: true},
	})
}

func (r *AchievementRepository) Update(
	ctx context.Context,
	id int32,
	title string,
	description string,
	impact string,
	importance string,
	achievedDate string,
) (db.Achievement, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return db.Achievement{}, err
	}

	importanceLevel := db.NullImportanceLevel{}
	if importance != "" {
		importanceLevel = db.NullImportanceLevel{
			ImportanceLevel: db.ImportanceLevel(importance),
			Valid:           true,
		}
	}

	var achievedDatePg pgtype.Date
	if achievedDate != "" {
		t, err := time.Parse("2006-01-02", achievedDate)
		if err != nil {
			return db.Achievement{}, err
		}
		achievedDatePg = TimeToPgDate(t)
	}

	return r.queries.UpdateAchievement(ctx, db.UpdateAchievementParams{
		ID:           id,
		UserID:       userID,
		Title:        title,
		Description:  StringToNullablePgText(description),
		Impact:       StringToNullablePgText(impact),
		Importance:   importanceLevel,
		AchievedDate: achievedDatePg,
	})
}

func (r *AchievementRepository) Delete(ctx context.Context, id int32) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return err
	}

	return r.queries.DeleteAchievement(ctx, db.DeleteAchievementParams{
		ID:     id,
		UserID: userID,
	})
}

// extractUserID extracts the user_id from Gin's context.
// Gin stores context keys as strings via ctx.Set("user_id", value).
func extractUserID(ctx context.Context) (int32, error) {
	userIDStr, ok := ctx.Value(string(userIDKey)).(string)
	if !ok || userIDStr == "" {
		return 0, ErrUnauthorizedContext
	}

	return helper.ParseID(userIDStr)
}
