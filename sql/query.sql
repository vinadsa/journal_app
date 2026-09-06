-- ========================
-- USERS
-- ========================

-- name: CreateUser :one
INSERT INTO users (name, email, password_hash, team_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1;

-- ========================
-- TEAMS
-- ========================

-- name: CreateTeam :one
INSERT INTO teams (name)
VALUES ($1)
RETURNING *;

-- name: GetTeamByID :one
SELECT * FROM teams
WHERE id = $1;

-- ========================
-- JOURNALS
-- ========================

-- name: CreateJournal :one
INSERT INTO journals (
    user_id, entry_date, title, did_today, learned_today,
    category, blockers, next_plan,
    visibility, kpi_period_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetJournalByID :one
SELECT * FROM journals
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL;

-- name: GetJournalsByDate :many
SELECT * FROM journals
WHERE user_id = $1
  AND entry_date = $2
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: GetJournalsByUser :many
SELECT * FROM journals
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY entry_date DESC;

-- name: GetJournalsByUserPaginated :many
SELECT * FROM journals
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY entry_date DESC
LIMIT $2 OFFSET $3;

-- name: GetJournalsByCategory :many
SELECT * FROM journals
WHERE user_id = $1
  AND category = $2
  AND deleted_at IS NULL
ORDER BY entry_date DESC;

-- name: GetJournalsByDateRange :many
SELECT * FROM journals
WHERE user_id = $1
  AND entry_date BETWEEN $2 AND $3
  AND deleted_at IS NULL
ORDER BY entry_date DESC;

-- name: GetJournalsByTitle :many
SELECT * FROM journals
WHERE user_id = $1
  AND title ILIKE '%' || $2 || '%'
  AND deleted_at IS NULL
ORDER BY entry_date DESC;

-- name: UpdateJournal :one
UPDATE journals
SET
    title           = COALESCE($3, title),
    did_today       = COALESCE($4, did_today),
    learned_today   = COALESCE($5, learned_today),
    category        = COALESCE($6, category),
    blockers        = COALESCE($7, blockers),
    next_plan       = COALESCE($8, next_plan),
    visibility      = COALESCE($9, visibility),
    kpi_period_id   = COALESCE($10, kpi_period_id)
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteJournal :exec
UPDATE journals
SET deleted_at = NOW()
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL;

-- name: RestoreJournal :exec
UPDATE journals
SET deleted_at = NULL
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NOT NULL;

-- name: HardDeleteJournal :exec
DELETE FROM journals
WHERE id = $1
  AND user_id = $2;
  
-- ========================
-- JOURNAL ATTACHMENTS
-- ========================

-- name: CreateAttachment :one
INSERT INTO journal_attachments (
  journal_id, file_path, file_name, file_type, file_size, 
  storage_key, thumbnail_path, checksum, uploaded_by
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetAttachmentsByJournal :many
SELECT * FROM journal_attachments
WHERE journal_id = $1
ORDER BY created_at ASC;

-- name: GetAttachmentByID :one
SELECT * FROM journal_attachments
WHERE id = $1;

-- name: DeleteAttachment :exec
DELETE FROM journal_attachments
WHERE id = $1
  AND journal_id = $2;

-- name: DeleteAllAttachmentsByJournal :exec
DELETE FROM journal_attachments
WHERE journal_id = $1;


-- ========================
-- KPI / DASHBOARD
-- ========================

-- name: CreateKPI :one
INSERT INTO kpi_periods (name, start_date, end_date, team_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetKPIByID :one
SELECT * FROM kpi_periods
WHERE id = $1;

-- name: GetKPIsByTeam :many
SELECT * FROM kpi_periods
WHERE team_id = $1
ORDER BY start_date DESC;

-- name: GetActiveKPIByTeam :one
SELECT * FROM kpi_periods
WHERE team_id = $1
  AND start_date <= NOW()
  AND end_date >= NOW()
ORDER BY start_date DESC
LIMIT 1;

-- name: GetActiveKPIByUser :one
SELECT kp.* FROM kpi_periods kp
JOIN users u ON u.team_id = kp.team_id
WHERE u.id = $1
  AND kp.start_date <= NOW()
  AND kp.end_date >= NOW()
ORDER BY kp.start_date DESC
LIMIT 1;

-- name: GetKPIsByUser :many
SELECT kp.* FROM kpi_periods kp
JOIN users u ON u.team_id = kp.team_id
WHERE u.id = $1
ORDER BY kp.start_date DESC;

-- name: GetKPIByDateAndUser :one
SELECT kp.* FROM kpi_periods kp
JOIN users u ON u.team_id = kp.team_id
WHERE u.id = $1
  AND $2 >= kp.start_date
  AND $2 <= kp.end_date
ORDER BY kp.start_date DESC
LIMIT 1;

-- name: GetKPISummaryByUser :many
SELECT * FROM journal_kpi_summary
WHERE user_id = $1
ORDER BY month DESC, week DESC;

-- name: GetKPISummaryByMonth :many
SELECT * FROM journal_kpi_summary
WHERE user_id = $1
  AND month = date_trunc('month', $2::timestamp with time zone)
ORDER BY week ASC;

-- name: CountJournalsByUser :one
SELECT COUNT(*) FROM journals
WHERE user_id = $1
  AND deleted_at IS NULL;

-- name: GetStreakByUser :many
SELECT entry_date FROM journals
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY entry_date DESC;

-- ========================
-- TAGS
-- ========================

-- name: CreateTag :one
INSERT INTO tags (name) VALUES ($1)
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
RETURNING *;

-- name: GetTagByID :one
SELECT * FROM tags WHERE id = $1;

-- name: GetTagByName :one
SELECT * FROM tags WHERE name = $1;

-- name: ListTags :many
SELECT * FROM tags ORDER BY name ASC;

-- name: ListTagsWithUsageByUser :many
SELECT 
    t.id, 
    t.name, 
    t.created_at, 
    COUNT(j.id)::bigint AS journal_count
FROM tags t
LEFT JOIN journal_tags jt ON jt.tag_id = t.id
LEFT JOIN journals j ON j.id = jt.journal_id AND j.user_id = $1
GROUP BY t.id, t.name, t.created_at
ORDER BY journal_count DESC, t.name ASC;

-- name: DeleteTag :exec
DELETE FROM tags WHERE id = $1;

-- ========================
-- JOURNAL TAGS
-- ========================

-- name: AddTagToJournal :exec
INSERT INTO journal_tags (journal_id, tag_id)
VALUES ($1, $2)
ON CONFLICT (journal_id, tag_id) DO NOTHING;

-- name: RemoveTagFromJournal :exec
DELETE FROM journal_tags
WHERE journal_id = $1 AND tag_id = $2;

-- name: GetTagsByJournal :many
SELECT t.id, t.name, t.created_at FROM tags t
JOIN journal_tags jt ON jt.tag_id = t.id
WHERE jt.journal_id = $1
ORDER BY t.name ASC;

-- name: GetJournalsByTag :many
SELECT j.id, j.user_id, j.entry_date, j.title, j.did_today, j.learned_today,
       j.category, j.blockers, j.next_plan,
       j.visibility, j.kpi_period_id, j.created_at, j.updated_at, j.deleted_at
FROM journals j
JOIN journal_tags jt ON jt.journal_id = j.id
WHERE jt.tag_id = $1
  AND j.user_id = $2
  AND j.deleted_at IS NULL
ORDER BY j.entry_date DESC;

-- ========================
-- ACHIEVEMENTS
-- ========================

-- name: CreateAchievement :one
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetAchievementByID :one
SELECT * FROM achievements
WHERE id = $1 AND user_id = $2;

-- name: GetAchievementsByJournal :many
SELECT DISTINCT a.id, a.journal_id, a.user_id, a.title, a.description, a.impact, a.importance, a.achieved_date, a.created_at, a.updated_at
FROM achievements a
LEFT JOIN achievement_journals aj ON aj.achievement_id = a.id
WHERE (a.journal_id = $1 OR aj.journal_id = $1)
ORDER BY a.created_at ASC;

-- name: AddJournalToAchievement :exec
INSERT INTO achievement_journals (achievement_id, journal_id)
VALUES ($1, $2)
ON CONFLICT (achievement_id, journal_id) DO NOTHING;

-- name: RemoveJournalFromAchievement :exec
DELETE FROM achievement_journals
WHERE achievement_id = $1 AND journal_id = $2;

-- name: GetJournalsByAchievement :many
SELECT j.id, j.user_id, j.entry_date, j.title, j.did_today, j.learned_today,
       j.category, j.blockers, j.next_plan,
       j.visibility, j.kpi_period_id, j.created_at, j.updated_at, j.deleted_at
FROM journals j
JOIN achievement_journals aj ON aj.journal_id = j.id
WHERE aj.achievement_id = $1
  AND j.deleted_at IS NULL
ORDER BY j.entry_date DESC;

-- name: GetAchievementJournalsByUser :many
SELECT aj.achievement_id, j.id AS journal_id, j.title, j.entry_date, j.category,
       a.title AS achievement_title, a.importance AS achievement_importance
FROM achievement_journals aj
JOIN achievements a ON a.id = aj.achievement_id
JOIN journals j ON j.id = aj.journal_id
WHERE a.user_id = $1 AND j.deleted_at IS NULL
ORDER BY j.entry_date DESC;

-- name: GetAchievementsByUser :many
SELECT * FROM achievements
WHERE user_id = $1
ORDER BY achieved_date DESC NULLS LAST, created_at DESC;

-- name: GetAchievementsByUserPaginated :many
SELECT * FROM achievements
WHERE user_id = $1
ORDER BY achieved_date DESC NULLS LAST, created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetAchievementsByDateRange :many
SELECT * FROM achievements
WHERE user_id = $1
  AND achieved_date BETWEEN $2 AND $3
ORDER BY achieved_date DESC;

-- name: GetAchievementsByImportance :many
SELECT * FROM achievements
WHERE user_id = $1
  AND importance = $2
ORDER BY achieved_date DESC NULLS LAST;

-- name: UpdateAchievement :one
UPDATE achievements
SET
    title         = COALESCE($3, title),
    description   = COALESCE($4, description),
    impact        = COALESCE($5, impact),
    importance    = COALESCE($6, importance),
    achieved_date = COALESCE($7, achieved_date)
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteAchievement :exec
DELETE FROM achievements
WHERE id = $1 AND user_id = $2;

-- ========================
-- RICH SEARCH
-- ========================

-- name: SearchJournals :many
SELECT DISTINCT j.id, j.user_id, j.entry_date, j.title, j.did_today, j.learned_today,
       j.category, j.blockers, j.next_plan,
       j.visibility, j.kpi_period_id, j.created_at, j.updated_at, j.deleted_at
FROM journals j
LEFT JOIN journal_tags jt ON jt.journal_id = j.id
LEFT JOIN tags t ON t.id = jt.tag_id
LEFT JOIN achievement_journals aj ON aj.journal_id = j.id
LEFT JOIN achievements a ON (a.id = aj.achievement_id OR a.journal_id = j.id)
WHERE j.user_id = $1
  AND j.deleted_at IS NULL
  AND (
    @keyword::text IS NULL OR @keyword::text = '' OR (
      j.title ILIKE '%' || @keyword || '%'
      OR j.did_today ILIKE '%' || @keyword || '%'
      OR j.learned_today ILIKE '%' || @keyword || '%'
      OR a.title ILIKE '%' || @keyword || '%'
      OR a.impact ILIKE '%' || @keyword || '%'
    )
  )
  AND (@category::text IS NULL OR @category::text = '' OR j.category = @category::journal_category)
  AND (@tag::text IS NULL OR @tag::text = '' OR t.name = @tag)
  AND (@importance::text IS NULL OR @importance::text = '' OR a.importance = @importance::importance_level)
  AND (@date_from::date IS NULL OR j.entry_date >= @date_from)
  AND (@date_to::date IS NULL OR j.entry_date <= @date_to)
ORDER BY j.entry_date DESC
LIMIT $2 OFFSET $3;

-- name: GetJournalTagsByUser :many
SELECT jt.journal_id, t.id as tag_id, t.name as tag_name
FROM journal_tags jt
JOIN tags t ON t.id = jt.tag_id
JOIN journals j ON j.id = jt.journal_id
WHERE j.user_id = $1
ORDER BY t.name ASC;

-- name: SearchAchievements :many
SELECT DISTINCT a.id, a.journal_id, a.user_id, a.title, a.description, a.impact,
       a.importance, a.achieved_date, a.created_at, a.updated_at
FROM achievements a
LEFT JOIN achievement_journals aj ON aj.achievement_id = a.id
LEFT JOIN journals j ON (j.id = aj.journal_id OR j.id = a.journal_id) AND j.deleted_at IS NULL
LEFT JOIN journal_tags jt ON jt.journal_id = j.id
LEFT JOIN tags t ON t.id = jt.tag_id
WHERE a.user_id = $1
  AND (
    @keyword::text IS NULL OR @keyword::text = '' OR (
      a.title ILIKE '%' || @keyword || '%'
      OR a.description ILIKE '%' || @keyword || '%'
      OR a.impact ILIKE '%' || @keyword || '%'
      OR j.title ILIKE '%' || @keyword || '%'
    )
  )
  AND (@importance::text IS NULL OR @importance::text = '' OR a.importance = @importance::importance_level)
  AND (@category::text IS NULL OR @category::text = '' OR j.category = @category::journal_category)
  AND (@tag::text IS NULL OR @tag::text = '' OR t.name = @tag)
  AND (@date_from::date IS NULL OR a.achieved_date >= @date_from)
  AND (@date_to::date IS NULL OR a.achieved_date <= @date_to)
ORDER BY a.achieved_date DESC NULLS LAST, a.created_at DESC
LIMIT $2 OFFSET $3;