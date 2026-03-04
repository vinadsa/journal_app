package handler

import (
	"net/http"

	"journal_app/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, authHandler *AuthHandler, authMW *middleware.AuthMiddleware) {
	// AUTH ROUTES
	r.POST("/login", authHandler.PostLogin)
	r.POST("/logout", authHandler.PostLogout)
	r.POST("/register", authHandler.PostRegister)

	private := r.Group("/")
	private.Use(authMW.RequireAuth())
	private.GET("/dashboard", notImplemented("GET /dashboard"))
	private.GET("/journals", notImplemented("GET /journals"))
	private.GET("/journals/new", notImplemented("GET /journals/new"))
	private.POST("/journals", notImplemented("POST /journals"))
	private.GET("/journals/:id/edit", notImplemented("GET /journals/:id/edit"))
	private.POST("/journals/:id", notImplemented("POST /journals/:id"))
	private.DELETE("/journals/:id", notImplemented("DELETE /journals/:id"))
}

func notImplemented(route string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.JSON(http.StatusNotImplemented, gin.H{
			"message": "route is registered but not implemented yet",
			"route":   route,
		})
	}
}
