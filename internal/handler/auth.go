package handler

import (
	"errors"
	"net/http"
	"strings"

	"journal_app/internal/middleware"
	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// Handler untuk autentikasi (login/logout)
type AuthHandler struct {
	authService *service.AuthService
	authMW      *middleware.AuthMiddleware
}

// Konstruktor untuk AuthHandler
func NewAuthHandler(authService *service.AuthService, authMW *middleware.AuthMiddleware) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		authMW:      authMW,
	}
}

// Handler untuk POST /login (proses login)
type loginRequest struct {
	Email    string `json:"email" form:"email"`
	Password string `json:"password" form:"password"`
}

// Handler untuk POST /register (proses registrasi)
type registerRequest struct {
	Name	 string `json:"name" form:"name"`
	Email    string `json:"email" form:"email"`
	Password string `json:"password" form:"password"`
}

// Register
func (h *AuthHandler) PostRegister(ctx *gin.Context) {
	var req registerRequest

	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message" : "invalid request body"})
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "email and password are required"})
		return
	}

	user, err := h.authService.Register(ctx.Request.Context(), req.Name, req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "invalid email or password"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to register"})
		return
	}

	userID, err := pgUUIDToString(user.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to register"})
		return
	}	

	ctx.JSON(http.StatusOK, gin.H{
		"message": "register success",
		"user": gin.H{
			"id":    userID,
			"name":  user.Name,
			"email": user.Email,
		},
	})
}

// Proses login: validasi input, cek kredensial, buat session, set cookie
func (h *AuthHandler) PostLogin(ctx *gin.Context) {
	var req loginRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "email and password are required"})
		return
	}

	user, err := h.authService.Login(ctx.Request.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "invalid email or password"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to login"})
		return
	}

	userID, err := pgUUIDToString(user.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to login"})
		return
	}

	token, err := h.authMW.CreateSession(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create session"})
		return
	}

	middleware.SetSessionCookie(ctx, token)
	ctx.JSON(http.StatusOK, gin.H{
		"message": "login success",
		"user": gin.H{
			"id":    userID,
			"name":  user.Name,
			"email": user.Email,
		},
	})
}

func (h *AuthHandler) PostLogout(ctx *gin.Context) {
	if token, err := ctx.Cookie("session_token"); err == nil && token != "" {
		h.authMW.DeleteSession(token)
	}
	middleware.ClearSessionCookie(ctx)
	ctx.JSON(http.StatusOK, gin.H{"message": "logout success"})
}

func pgUUIDToString(id pgtype.UUID) (string, error) {
	if !id.Valid {
		return "", errors.New("invalid user id")
	}
	uid, err := uuid.FromBytes(id.Bytes[:])
	if err != nil {
		return "", err
	}
	return uid.String(), nil
}
