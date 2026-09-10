package service

import (
	"context"
	"fmt"
	"time"

	"journal_app/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

type TeamService struct {
	queries *db.Queries
}

func NewTeamService(queries *db.Queries) *TeamService {
	return &TeamService{queries: queries}
}

func (s *TeamService) CreateTeam(ctx context.Context, name string) (db.Team, error) {
	return s.queries.CreateTeam(ctx, name)
}

type TeamMemberOverview struct {
	ID                   int32      `json:"id"`
	Name                 string     `json:"name"`
	Email                string     `json:"email"`
	Role                 string     `json:"role"`
	TotalJournals        int64      `json:"total_journals"`
	ActiveDays           int64      `json:"active_days"`
	LastEntryDate        *time.Time `json:"last_entry_date"`
	TotalAchievements    int64      `json:"total_achievements"`
	CriticalAchievements int64      `json:"critical_achievements"`
	HighAchievements     int64      `json:"high_achievements"`
	FoundationJournals   int64      `json:"foundation_journals"`
	IWQPercentage        int        `json:"iwq_percentage"`
}

type TeamOverviewRecentAchievement struct {
	ID           int32      `json:"id"`
	UserID       int32      `json:"user_id"`
	UserName     string     `json:"user_name"`
	Title        string     `json:"title"`
	Importance   string     `json:"importance"`
	AchievedDate *time.Time `json:"achieved_date"`
	Impact       *string    `json:"impact"`
}

type TeamSummary struct {
	TotalMembers       int    `json:"total_members"`
	TotalJournals      int64  `json:"total_journals"`
	TotalAchievements  int64  `json:"total_achievements"`
	TeamIWQPercentage  int    `json:"team_iwq_percentage"`
	FoundationJournals int64  `json:"foundation_journals"`
	StartDate          string `json:"start_date,omitempty"`
	EndDate            string `json:"end_date,omitempty"`
}

type TeamInfo struct {
	ID        int32  `json:"id"`
	Name      string `json:"name"`
	ManagerID *int32 `json:"manager_id"`
}

type TeamOverviewResponse struct {
	Team               TeamInfo                        `json:"team"`
	Summary            TeamSummary                     `json:"summary"`
	Members            []TeamMemberOverview            `json:"members"`
	RecentAchievements []TeamOverviewRecentAchievement `json:"recent_achievements"`
}

// GetTeamOverview returns aggregated team metrics.
// When startDate/endDate are non-nil, all stats are scoped to that date range.
// When nil, returns all-time stats (backward compatible).
func (s *TeamService) GetTeamOverview(ctx context.Context, managerUserID int32, startDate, endDate *time.Time) (*TeamOverviewResponse, error) {
	// 1. Resolve team for this manager/user
	teamRow, err := s.queries.GetTeamByManager(ctx, pgtype.Int4{Int32: managerUserID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("no team found for manager/user: %w", err)
	}

	teamID := pgtype.Int4{Int32: teamRow.ID, Valid: true}
	isBounded := startDate != nil && endDate != nil

	// 2. Fetch all members
	members, err := s.queries.GetTeamMembers(ctx, teamID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch team members: %w", err)
	}

	// 3. Batch fetch stats (zero N+1 queries)
	// Use bounded or unbounded queries depending on date range
	journalStatsMap := make(map[int32]journalStatEntry)
	achStatsMap := make(map[int32]achStatEntry)
	foundStatsMap := make(map[int32]int64)

	if isBounded {
		sdPg := pgtype.Date{Time: *startDate, Valid: true}
		edPg := pgtype.Date{Time: *endDate, Valid: true}

		journalStats, err := s.queries.GetTeamJournalStatsBounded(ctx, db.GetTeamJournalStatsBoundedParams{
			TeamID: teamID, StartDate: sdPg, EndDate: edPg,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to fetch journal stats: %w", err)
		}
		for _, js := range journalStats {
			journalStatsMap[js.UserID] = journalStatEntry{
				TotalJournals: js.TotalJournals,
				ActiveDays:    js.ActiveDays,
				LastEntryDate: js.LastEntryDate,
			}
		}

		achStats, err := s.queries.GetTeamAchievementStatsBounded(ctx, db.GetTeamAchievementStatsBoundedParams{
			TeamID: teamID, StartDate: sdPg, EndDate: edPg,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to fetch achievement stats: %w", err)
		}
		for _, as := range achStats {
			achStatsMap[as.UserID] = achStatEntry{
				TotalAchievements:    as.TotalAchievements,
				CriticalAchievements: as.CriticalAchievements,
				HighAchievements:     as.HighAchievements,
			}
		}

		foundStats, err := s.queries.GetTeamFoundationStatsBounded(ctx, db.GetTeamFoundationStatsBoundedParams{
			TeamID: teamID, StartDate: sdPg, EndDate: edPg,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to fetch foundation stats: %w", err)
		}
		for _, fs := range foundStats {
			foundStatsMap[fs.UserID] = fs.FoundationJournals
		}
	} else {
		journalStats, err := s.queries.GetTeamJournalStats(ctx, teamID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch journal stats: %w", err)
		}
		for _, js := range journalStats {
			journalStatsMap[js.UserID] = journalStatEntry{
				TotalJournals: js.TotalJournals,
				ActiveDays:    js.ActiveDays,
				LastEntryDate: js.LastEntryDate,
			}
		}

		achStats, err := s.queries.GetTeamAchievementStats(ctx, teamID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch achievement stats: %w", err)
		}
		for _, as := range achStats {
			achStatsMap[as.UserID] = achStatEntry{
				TotalAchievements:    as.TotalAchievements,
				CriticalAchievements: as.CriticalAchievements,
				HighAchievements:     as.HighAchievements,
			}
		}

		foundStats, err := s.queries.GetTeamFoundationStats(ctx, teamID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch foundation stats: %w", err)
		}
		for _, fs := range foundStats {
			foundStatsMap[fs.UserID] = fs.FoundationJournals
		}
	}

	// Fetch recent achievements (bounded or unbounded)
	var recentAchs []recentAchEntry
	if isBounded {
		sdPg := pgtype.Date{Time: *startDate, Valid: true}
		edPg := pgtype.Date{Time: *endDate, Valid: true}
		rows, err := s.queries.GetTeamRecentAchievementsBounded(ctx, db.GetTeamRecentAchievementsBoundedParams{
			TeamID: teamID, StartDate: sdPg, EndDate: edPg,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to fetch recent achievements: %w", err)
		}
		for _, ra := range rows {
			recentAchs = append(recentAchs, recentAchEntry{
				ID:           ra.ID,
				UserID:       ra.UserID,
				UserName:     ra.UserName,
				Title:        ra.Title,
				Importance:   ra.Importance,
				AchievedDate: ra.AchievedDate,
				Impact:       ra.Impact,
			})
		}
	} else {
		rows, err := s.queries.GetTeamRecentAchievements(ctx, teamID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch recent achievements: %w", err)
		}
		for _, ra := range rows {
			recentAchs = append(recentAchs, recentAchEntry{
				ID:           ra.ID,
				UserID:       ra.UserID,
				UserName:     ra.UserName,
				Title:        ra.Title,
				Importance:   ra.Importance,
				AchievedDate: ra.AchievedDate,
				Impact:       ra.Impact,
			})
		}
	}

	// 4. In-memory assembly
	var totalJournals int64
	var totalAchievements int64
	var totalFoundation int64

	memberOverviews := make([]TeamMemberOverview, 0, len(members))
	for _, m := range members {
		js := journalStatsMap[m.ID]
		as := achStatsMap[m.ID]
		fs := foundStatsMap[m.ID]

		var lastDate *time.Time
		if js.LastEntryDate.Valid {
			t := js.LastEntryDate.Time
			lastDate = &t
		}

		iwq := 0
		if js.TotalJournals > 0 {
			iwq = int((float64(fs) / float64(js.TotalJournals)) * 100)
		}

		totalJournals += js.TotalJournals
		totalAchievements += as.TotalAchievements
		totalFoundation += fs

		memberOverviews = append(memberOverviews, TeamMemberOverview{
			ID:                   m.ID,
			Name:                 m.Name,
			Email:                m.Email,
			Role:                 string(m.Role),
			TotalJournals:        js.TotalJournals,
			ActiveDays:           js.ActiveDays,
			LastEntryDate:        lastDate,
			TotalAchievements:    as.TotalAchievements,
			CriticalAchievements: as.CriticalAchievements,
			HighAchievements:     as.HighAchievements,
			FoundationJournals:   fs,
			IWQPercentage:        iwq,
		})
	}

	teamIWQ := 0
	if totalJournals > 0 {
		teamIWQ = int((float64(totalFoundation) / float64(totalJournals)) * 100)
	}

	recentItems := make([]TeamOverviewRecentAchievement, 0, len(recentAchs))
	for _, ra := range recentAchs {
		var achDate *time.Time
		if ra.AchievedDate.Valid {
			t := ra.AchievedDate.Time
			achDate = &t
		}
		var imp *string
		if ra.Impact.Valid {
			imp = &ra.Impact.String
		}

		importanceStr := "medium"
		if ra.Importance.Valid {
			importanceStr = string(ra.Importance.ImportanceLevel)
		}

		recentItems = append(recentItems, TeamOverviewRecentAchievement{
			ID:           ra.ID,
			UserID:       ra.UserID,
			UserName:     ra.UserName,
			Title:        ra.Title,
			Importance:   importanceStr,
			AchievedDate: achDate,
			Impact:       imp,
		})
	}

	var mgrID *int32
	if teamRow.ManagerID.Valid {
		id := teamRow.ManagerID.Int32
		mgrID = &id
	}

	summary := TeamSummary{
		TotalMembers:       len(members),
		TotalJournals:      totalJournals,
		TotalAchievements:  totalAchievements,
		TeamIWQPercentage:  teamIWQ,
		FoundationJournals: totalFoundation,
	}
	if isBounded {
		summary.StartDate = startDate.Format("2006-01-02")
		summary.EndDate = endDate.Format("2006-01-02")
	}

	return &TeamOverviewResponse{
		Team: TeamInfo{
			ID:        teamRow.ID,
			Name:      teamRow.Name,
			ManagerID: mgrID,
		},
		Summary:            summary,
		Members:            memberOverviews,
		RecentAchievements: recentItems,
	}, nil
}

// Internal helper structs for unified stat assembly
type journalStatEntry struct {
	TotalJournals int64
	ActiveDays    int64
	LastEntryDate pgtype.Date
}

type achStatEntry struct {
	TotalAchievements    int64
	CriticalAchievements int64
	HighAchievements     int64
}

type recentAchEntry struct {
	ID           int32
	UserID       int32
	UserName     string
	Title        string
	Importance   db.NullImportanceLevel
	AchievedDate pgtype.Date
	Impact       pgtype.Text
}
