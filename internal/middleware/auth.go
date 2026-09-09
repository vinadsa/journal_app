package middleware

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"strconv"
	"time"

	"journal_app/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	sessionCookieName = "session_token"
	SessionDuration   = 7 * 24 * time.Hour // 7 days
)

// AuthMiddleware handles database-backed sessions via PostgreSQL
type AuthMiddleware struct {
	queries *db.Queries
}

// NewAuthMiddleware constructs a new AuthMiddleware backed by database queries
func NewAuthMiddleware(queries *db.Queries) *AuthMiddleware {
	return &AuthMiddleware{
		queries: queries,
	}
}

func (m *AuthMiddleware) CreateSession(ctx context.Context, userID int32) (string, error) {
	token, err := generateToken()
	if err != nil {
		return "", err
	}

	expiresAt := time.Now().Add(SessionDuration)
	_, err = m.queries.CreateSession(ctx, db.CreateSessionParams{
		Token:  token,
		UserID: userID,
		ExpiresAt: pgtype.Timestamptz{
			Time:  expiresAt,
			Valid: true,
		},
	})
	if err != nil {
		return "", err
	}

	return token, nil
}

func (m *AuthMiddleware) DeleteSession(ctx context.Context, token string) error {
	return m.queries.DeleteSession(ctx, token)
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		token, err := ctx.Cookie(sessionCookieName)
		if err != nil || token == "" {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		session, err := m.queries.GetSession(ctx.Request.Context(), token)
		if err != nil {
			ClearSessionCookie(ctx)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		// Asynchronously update activity timestamp
		go func(tok string) {
			_ = m.queries.UpdateSessionActivity(context.Background(), tok)
		}(token)

		ctx.Set("user_id", strconv.Itoa(int(session.UserID)))
		ctx.Set("user_email", session.UserEmail)
		ctx.Set("user_role", string(session.UserRole))
		ctx.Next()
	}
}

func SetSessionCookie(ctx *gin.Context, token string) {
	maxAge := int(SessionDuration.Seconds())
	ctx.SetSameSite(http.SameSiteLaxMode)
	ctx.SetCookie(sessionCookieName, token, maxAge, "/", "", false, true)
}

func ClearSessionCookie(ctx *gin.Context) {
	ctx.SetSameSite(http.SameSiteLaxMode)
	ctx.SetCookie(sessionCookieName, "", -1, "/", "", false, true)
}

func generateToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

