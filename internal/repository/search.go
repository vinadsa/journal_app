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

type TagSummary struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
}

type AchievementSummary struct {
	ID         int32  `json:"id"`
	Title      string `json:"title"`
	Importance string `json:"importance"`
}

type EnrichedJournal struct {
	db.Journal
	Tags         []TagSummary         `json:"tags"`
	Achievements []AchievementSummary `json:"achievements"`
}

type JournalSummary struct {
	ID        int32       `json:"id"`
	Title     string      `json:"title"`
	EntryDate pgtype.Date `json:"entry_date"`
	Category  string      `json:"category"`
}

type EnrichedAchievement struct {
	db.Achievement
	LinkedJournals []JournalSummary `json:"linked_journals"`
}

type SearchParams struct {
	Keyword    string
	Category   string
	Tag        string
	Importance string
	DateFrom   string
	DateTo     string
	Limit      int32
	Offset     int32
}

type SearchAchievementParams struct {
	Keyword    string
	Importance string
	Category   string
	Tag        string
	DateFrom   string
	DateTo     string
	Limit      int32
	Offset     int32
}

func (r *SearchRepository) SearchJournals(ctx context.Context, params SearchParams) ([]EnrichedJournal, error) {
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

	rawJournals, err := r.queries.SearchJournals(ctx, db.SearchJournalsParams{
		UserID:     userID,
		Limit:      params.Limit,
		Offset:     params.Offset,
		Keyword:    params.Keyword,
		Category:   params.Category,
		Tag:        params.Tag,
		Importance: params.Importance,
		DateFrom:   dateFrom,
		DateTo:     dateTo,
	})
	if err != nil {
		return nil, err
	}

	if len(rawJournals) == 0 {
		return []EnrichedJournal{}, nil
	}

	// Fetch tags and linked achievements for this user to enrich results
	tagRows, _ := r.queries.GetJournalTagsByUser(ctx, userID)
	tagsByJournal := make(map[int32][]TagSummary)
	for _, tr := range tagRows {
		tagsByJournal[tr.JournalID] = append(tagsByJournal[tr.JournalID], TagSummary{
			ID:   tr.TagID,
			Name: tr.TagName,
		})
	}

	linkRows, _ := r.queries.GetAchievementJournalsByUser(ctx, userID)
	achievementsByJournal := make(map[int32][]AchievementSummary)
	for _, lr := range linkRows {
		imp := ""
		if lr.AchievementImportance.Valid {
			imp = string(lr.AchievementImportance.ImportanceLevel)
		}
		achievementsByJournal[lr.JournalID] = append(achievementsByJournal[lr.JournalID], AchievementSummary{
			ID:         lr.AchievementID,
			Title:      lr.AchievementTitle,
			Importance: imp,
		})
	}

	enriched := make([]EnrichedJournal, len(rawJournals))
	for i, j := range rawJournals {
		tags := tagsByJournal[j.ID]
		if tags == nil {
			tags = []TagSummary{}
		}
		achs := achievementsByJournal[j.ID]
		if achs == nil {
			achs = []AchievementSummary{}
		}
		enriched[i] = EnrichedJournal{
			Journal:      j,
			Tags:         tags,
			Achievements: achs,
		}
	}

	return enriched, nil
}

func (r *SearchRepository) SearchAchievements(ctx context.Context, params SearchAchievementParams) ([]EnrichedAchievement, error) {
	userID, err := extractUserID(ctx)
	if err != nil {
		return nil, err
	}

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

	rawAchievements, err := r.queries.SearchAchievements(ctx, db.SearchAchievementsParams{
		UserID:     userID,
		Limit:      params.Limit,
		Offset:     params.Offset,
		Keyword:    params.Keyword,
		Importance: params.Importance,
		Category:   params.Category,
		Tag:        params.Tag,
		DateFrom:   dateFrom,
		DateTo:     dateTo,
	})
	if err != nil {
		return nil, err
	}

	if len(rawAchievements) == 0 {
		return []EnrichedAchievement{}, nil
	}

	// Fetch linked journals for achievements
	linkRows, _ := r.queries.GetAchievementJournalsByUser(ctx, userID)
	journalsByAchievement := make(map[int32][]JournalSummary)
	for _, lr := range linkRows {
		cat := ""
		if lr.Category.Valid {
			cat = string(lr.Category.JournalCategory)
		}
		title := "Untitled"
		if lr.Title.Valid {
			title = lr.Title.String
		}
		journalsByAchievement[lr.AchievementID] = append(journalsByAchievement[lr.AchievementID], JournalSummary{
			ID:        lr.JournalID,
			Title:     title,
			EntryDate: lr.EntryDate,
			Category:  cat,
		})
	}

	enriched := make([]EnrichedAchievement, len(rawAchievements))
	for i, a := range rawAchievements {
		jList := journalsByAchievement[a.ID]
		if jList == nil {
			jList = []JournalSummary{}
		}
		enriched[i] = EnrichedAchievement{
			Achievement:    a,
			LinkedJournals: jList,
		}
	}

	return enriched, nil
}

