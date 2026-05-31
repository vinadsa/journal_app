package handler

import (
	"net/http"

	"journal_app/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, authHandler *AuthHandler, authMW *middleware.AuthMiddleware, journalHandler *JournalHandler, teamHandler *TeamHandler) {
	// AUTH ROUTES
	r.POST("/login", authHandler.PostLogin)
	r.POST("/logout", authHandler.PostLogout)
	r.POST("/register", authHandler.PostRegister)

	private := r.Group("/")
	private.Use(authMW.RequireAuth())
	// Halaman Dashboard
	private.GET("/dashboard", notImplemented("GET /dashboard"))

	// Halaman Journal
	private.GET("/journals", notImplemented("GET /journals"))

	// Halaman New Journal
	private.GET("/journals/new", notImplemented("GET /journals/new"))

	// Submit New Journal
	private.POST("/journals", journalHandler.CreateJournal)

	// Halaman Edit Journal
	private.GET("/journals/:id/edit", notImplemented("GET /journals/:id/edit"))

	// Submit Edit Journal
	private.POST("/journals/:id", notImplemented("POST /journals/:id"))

	// Delete Journal
	private.DELETE("/journals/:id", notImplemented("DELETE /journals/:id"))

	// Create Team
	private.POST("/teams", teamHandler.CreateTeam)

	// Create KPI Period
	private.POST("/kpi-periods", notImplemented("POST /kpi-periods"))
}

func notImplemented(route string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.JSON(http.StatusNotImplemented, gin.H{
			"message": "route is registered but not implemented yet",
			"route":   route,
		})
	}
}
