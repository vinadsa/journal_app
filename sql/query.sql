-- ========================
-- USERS
-- ========================

-- name: CreateUser :one
INSERT INTO users (name, email, password_hash)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1;


-- ========================
-- JOURNALS
-- ========================

-- name: CreateJournal :one
INSERT INTO journals (
    user_id, entry_date, title, did_today, learned_today,
    category, blockers, next_plan,
    tasks_completed, hours_coded, mood_score
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetJournalByID :one
SELECT * FROM journals
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL;

-- name: GetJournalByDate :one
SELECT * FROM journals
WHERE user_id = $1
  AND entry_date = $2
  AND deleted_at IS NULL;

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
    title           = COALESCE($6, title),
    category        = COALESCE($7, category),
    blockers        = COALESCE($8, blockers),
    next_plan       = COALESCE($9, next_plan),
    tasks_completed = COALESCE($10, tasks_completed),
    hours_coded     = COALESCE($11, hours_coded),
    mood_score      = COALESCE($12, mood_score)
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
INSERT INTO journal_attachments (journal_id, file_path, file_name, file_type, file_size)
VALUES ($1, $2, $3, $4, $5)
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