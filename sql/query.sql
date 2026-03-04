-- name: CreateUser :one
INSERT INTO users (name, email, password_hash)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: CreateJournal :one
INSERT INTO journals (user_id, entry_date, did_today, learned_today, file_path)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetJournalsByUser :many
SELECT * FROM journals
WHERE user_id = $1
ORDER BY entry_date DESC;

-- name: DeleteJournal :exec
DELETE FROM journals
WHERE id = $1 AND user_id = $2;
