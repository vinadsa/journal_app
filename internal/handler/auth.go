package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"journal_app/internal/middleware"
	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
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
	Name     string `json:"name" form:"name"`
	Email    string `json:"email" form:"email"`
	Password string `json:"password" form:"password"`
	TeamID   int32  `json:"team_id" form:"team_id"`
}

// Register
func (h *AuthHandler) PostRegister(ctx *gin.Context) {
	var req registerRequest

	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "email and password are required"})
		return
	}

	user, err := h.authService.Register(ctx.Request.Context(), req.Name, req.Email, req.Password, req.TeamID)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "invalid email or password"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to register", "error": err.Error()})
		return
	}

	userID := fmt.Sprintf("%d", user.ID)

	token, err := h.authMW.CreateSession(ctx.Request.Context(), user.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create session"})
		return
	}

	middleware.SetSessionCookie(ctx, token)
	ctx.JSON(http.StatusOK, gin.H{
		"message": "register success",
		"user": gin.H{
			"id":      userID,
			"name":    user.Name,
			"email":   user.Email,
			"role":    user.Role,
			"team_id": user.TeamID,
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

	userID := fmt.Sprintf("%d", user.ID)

	token, err := h.authMW.CreateSession(ctx.Request.Context(), user.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create session"})
		return
	}

	middleware.SetSessionCookie(ctx, token)
	ctx.JSON(http.StatusOK, gin.H{
		"message": "login success",
		"user": gin.H{
			"id":      userID,
			"name":    user.Name,
			"email":   user.Email,
			"role":    user.Role,
			"team_id": user.TeamID,
		},
	})
}

func (h *AuthHandler) PostLogout(ctx *gin.Context) {
	if token, err := ctx.Cookie("session_token"); err == nil && token != "" {
		_ = h.authMW.DeleteSession(ctx.Request.Context(), token)
	}
	middleware.ClearSessionCookie(ctx)
	ctx.JSON(http.StatusOK, gin.H{"message": "logout success"})
}

func (h *AuthHandler) GetMe(ctx *gin.Context) {
	userIDStr := ctx.GetString("user_id")
	if userIDStr == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id in context"})
		return
	}

	user, err := h.authService.GetUserByID(ctx.Request.Context(), int32(userID))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}

	teamName := ""
	if user.TeamID.Valid {
		if team, err := h.authService.GetTeamByID(ctx.Request.Context(), user.TeamID.Int32); err == nil {
			teamName = team.Name
		}
	}

	var teamIDVal *int32
	if user.TeamID.Valid {
		teamIDVal = &user.TeamID.Int32
	}

	ctx.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        fmt.Sprintf("%d", user.ID),
			"name":      user.Name,
			"email":     user.Email,
			"role":      user.Role,
			"team_id":   teamIDVal,
			"team_name": teamName,
		},
	})
}
