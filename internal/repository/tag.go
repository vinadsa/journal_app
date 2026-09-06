package repository

import (
	"context"
	"strings"

	"journal_app/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type TagWithUsage struct {
	ID           int32            `json:"id"`
	Name         string           `json:"name"`
	CreatedAt    pgtype.Timestamp `json:"created_at"`
	JournalCount int64            `json:"journal_count"`
}

type TagRepository struct {
	queries *db.Queries
}

func NewTagRepository(queries *db.Queries) *TagRepository {
	return &TagRepository{queries: queries}
}

func (r *TagRepository) CreateTag(ctx context.Context, name string) (db.Tag, error) {
	// Normalize: lowercase and trim
	name = strings.TrimSpace(strings.ToLower(name))
	return r.queries.CreateTag(ctx, name)
}

func (r *TagRepository) GetTagByID(ctx context.Context, id int32) (db.Tag, error) {
	return r.queries.GetTagByID(ctx, id)
}

func (r *TagRepository) ListTags(ctx context.Context) ([]TagWithUsage, error) {
	userID, err := extractUserID(ctx)
	if err == nil {
		rows, err := r.queries.ListTagsWithUsageByUser(ctx, userID)
		if err == nil {
			result := make([]TagWithUsage, len(rows))
			for i, row := range rows {
				result[i] = TagWithUsage{
					ID:           row.ID,
					Name:         row.Name,
					CreatedAt:    row.CreatedAt,
					JournalCount: row.JournalCount,
				}
			}
			return result, nil
		}
	}

	tags, err := r.queries.ListTags(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]TagWithUsage, len(tags))
	for i, t := range tags {
		result[i] = TagWithUsage{
			ID:           t.ID,
			Name:         t.Name,
			CreatedAt:    t.CreatedAt,
			JournalCount: 0,
		}
	}
	return result, nil
}

func (r *TagRepository) DeleteTag(ctx context.Context, id int32) error {
	return r.queries.DeleteTag(ctx, id)
}

func (r *TagRepository) AddTagToJournal(ctx context.Context, journalID, tagID int32) error {
	return r.queries.AddTagToJournal(ctx, db.AddTagToJournalParams{
		JournalID: journalID,
		TagID:     tagID,
	})
}

func (r *TagRepository) RemoveTagFromJournal(ctx context.Context, journalID, tagID int32) error {
	return r.queries.RemoveTagFromJournal(ctx, db.RemoveTagFromJournalParams{
		JournalID: journalID,
		TagID:     tagID,
	})
}

func (r *TagRepository) GetTagsByJournal(ctx context.Context, journalID int32) ([]db.Tag, error) {
	return r.queries.GetTagsByJournal(ctx, journalID)
}

func (r *TagRepository) GetJournalsByTag(ctx context.Context, tagID int32) ([]db.Journal, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

	return r.queries.GetJournalsByTag(ctx, db.GetJournalsByTagParams{
		TagID:  tagID,
		UserID: userID,
	})
}
