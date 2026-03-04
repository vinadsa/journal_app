package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

const sessionCookieName = "session_token"

// Objek Session simple ke memory, not ideal
type AuthMiddleware struct {
	mu       sync.RWMutex
	sessions map[string]string
}

// Konstruktor untuk AuthMiddleware
func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{
		sessions: make(map[string]string),
	}
}

func (m *AuthMiddleware) CreateSession(userID string) (string, error) {
	token, err := generateToken()
	if err != nil {
		return "", err
	}

	m.mu.Lock()
	m.sessions[token] = userID
	m.mu.Unlock()

	return token, nil
}

func (m *AuthMiddleware) DeleteSession(token string) {
	m.mu.Lock()
	delete(m.sessions, token)
	m.mu.Unlock()
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		token, err := ctx.Cookie(sessionCookieName)
		if err != nil || token == "" {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		m.mu.RLock()
		userID, ok := m.sessions[token]
		m.mu.RUnlock()
		if !ok {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		ctx.Set("user_id", userID)
		ctx.Next()
	}
}

func SetSessionCookie(ctx *gin.Context, token string) {
	ctx.SetCookie(sessionCookieName, token, 60*60*24, "/", "", false, true)
}

func ClearSessionCookie(ctx *gin.Context) {
	ctx.SetCookie(sessionCookieName, "", -1, "/", "", false, true)
}

func generateToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
