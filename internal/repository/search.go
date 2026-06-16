package repository

import (
	"context"
	"time"

	"journal_app/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

type SearchRepository struct {
	queries *db.Queries
}

func NewSearchRepository(queries *db.Queries) *SearchRepository {
	return &SearchRepository{queries: queries}
}

type SearchParams struct {
	Keyword  string
	Category string
	Tag      string
	DateFrom string
	DateTo   string
	Limit    int32
	Offset   int32
}

func (r *SearchRepository) SearchJournals(ctx context.Context, params SearchParams) ([]db.Journal, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

	// Default pagination
	if params.Limit <= 0 {
		params.Limit = 20
	}
	if params.Offset < 0 {
		params.Offset = 0
	}

	var dateFrom, dateTo pgtype.Date
	if params.DateFrom != "" {
		t, err := time.Parse("2006-01-02", params.DateFrom)
		if err != nil {
			return nil, err
		}
		dateFrom = TimeToPgDate(t)
	}
	if params.DateTo != "" {
		t, err := time.Parse("2006-01-02", params.DateTo)
		if err != nil {
			return nil, err
		}
		dateTo = TimeToPgDate(t)
	}

	return r.queries.SearchJournals(ctx, db.SearchJournalsParams{
		UserID:   userID,
		Limit:    params.Limit,
		Offset:   params.Offset,
		Keyword:  params.Keyword,
		Category: params.Category,
		Tag:      params.Tag,
		DateFrom: dateFrom,
		DateTo:   dateTo,
	})
}
