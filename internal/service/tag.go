package service

import (
	"context"
	"errors"

	"journal_app/internal/db"
	"journal_app/internal/repository"
)

var ErrTagNameRequired = errors.New("tag name is required")

type TagService struct {
	repository *repository.TagRepository
}

func NewTagService(repository *repository.TagRepository) *TagService {
	return &TagService{repository: repository}
}

func (s *TagService) CreateTag(ctx context.Context, name string) (db.Tag, error) {
	if name == "" {
		return db.Tag{}, ErrTagNameRequired
	}
	// Normalization (lowercase, trim) is handled in the repository layer
	return s.repository.CreateTag(ctx, name)
}

func (s *TagService) ListTags(ctx context.Context) ([]repository.TagWithUsage, error) {
	return s.repository.ListTags(ctx)
}

func (s *TagService) DeleteTag(ctx context.Context, id int32) error {
	return s.repository.DeleteTag(ctx, id)
}

func (s *TagService) AddTagToJournal(ctx context.Context, journalID, tagID int32) error {
	return s.repository.AddTagToJournal(ctx, journalID, tagID)
}

func (s *TagService) RemoveTagFromJournal(ctx context.Context, journalID, tagID int32) error {
	return s.repository.RemoveTagFromJournal(ctx, journalID, tagID)
}

func (s *TagService) GetTagsByJournal(ctx context.Context, journalID int32) ([]db.Tag, error) {
	return s.repository.GetTagsByJournal(ctx, journalID)
}
