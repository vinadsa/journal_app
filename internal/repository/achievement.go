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

	return r.queries.CreateAchievement(ctx, db.CreateAchievementParams{
		JournalID:    journalID,
		UserID:       userID,
		Title:        title,
		Description:  StringToNullablePgText(description),
		Impact:       StringToNullablePgText(impact),
		Importance:   importanceLevel,
		AchievedDate: achievedDatePg,
	})
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
	return r.queries.GetAchievementsByJournal(ctx, journalID)
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
