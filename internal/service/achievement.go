package service

import (
	"context"
	"errors"

	"journal_app/internal/db"
	"journal_app/internal/repository"
)

var (
	ErrAchievementTitleRequired = errors.New("achievement title is required")
	ErrAchievementJournalRequired = errors.New("journal_id is required for achievement")
)

type AchievementService struct {
	repository *repository.AchievementRepository
}

func NewAchievementService(repository *repository.AchievementRepository) *AchievementService {
	return &AchievementService{repository: repository}
}

func (s *AchievementService) Create(
	ctx context.Context,
	journalID int32,
	journalIDs []int32,
	title string,
	description string,
	impact string,
	importance string,
	achievedDate string,
) (db.Achievement, error) {
	if title == "" {
		return db.Achievement{}, ErrAchievementTitleRequired
	}
	if journalID <= 0 && len(journalIDs) == 0 {
		return db.Achievement{}, ErrAchievementJournalRequired
	}

	return s.repository.Create(ctx, journalID, journalIDs, title, description, impact, importance, achievedDate)
}

func (s *AchievementService) LinkJournal(ctx context.Context, achievementID, journalID int32) error {
	return s.repository.AddJournalToAchievement(ctx, achievementID, journalID)
}

func (s *AchievementService) UnlinkJournal(ctx context.Context, achievementID, journalID int32) error {
	return s.repository.RemoveJournalFromAchievement(ctx, achievementID, journalID)
}

func (s *AchievementService) GetJournalsByAchievement(ctx context.Context, achievementID int32) ([]db.Journal, error) {
	return s.repository.GetJournalsByAchievement(ctx, achievementID)
}

func (s *AchievementService) GetAchievementJournalsByUser(ctx context.Context) ([]db.GetAchievementJournalsByUserRow, error) {
	return s.repository.GetAchievementJournalsByUser(ctx)
}

func (s *AchievementService) GetByID(ctx context.Context, id int32) (db.Achievement, error) {
	return s.repository.GetByID(ctx, id)
}

func (s *AchievementService) GetByJournal(ctx context.Context, journalID int32) ([]db.Achievement, error) {
	return s.repository.GetByJournal(ctx, journalID)
}

func (s *AchievementService) GetByUser(ctx context.Context) ([]db.Achievement, error) {
	return s.repository.GetByUser(ctx)
}

func (s *AchievementService) GetByUserPaginated(ctx context.Context, limit, offset int32) ([]db.Achievement, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return s.repository.GetByUserPaginated(ctx, limit, offset)
}

func (s *AchievementService) Update(
	ctx context.Context,
	id int32,
	title string,
	description string,
	impact string,
	importance string,
	achievedDate string,
) (db.Achievement, error) {
	return s.repository.Update(ctx, id, title, description, impact, importance, achievedDate)
}

func (s *AchievementService) Delete(ctx context.Context, id int32) error {
	return s.repository.Delete(ctx, id)
}
