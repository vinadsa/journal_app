package handler

import (
	"net/http"

	"journal_app/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(
	r *gin.Engine,
	authHandler *AuthHandler,
	authMW *middleware.AuthMiddleware,
	journalHandler *JournalHandler,
	teamHandler *TeamHandler,
	achievementHandler *AchievementHandler,
	tagHandler *TagHandler,
	searchHandler *SearchHandler,
	kpiHandler *KPIHandler,
	aiHandler *AIHandler,
	calibrationHandler *CalibrationHandler,
	recognitionHandler *RecognitionHandler,
) {
	// AUTH ROUTES (with brute-force rate limit protection)
	authLimiter := middleware.RateLimitAuth()
	r.POST("/login", authLimiter, authHandler.PostLogin)
	r.POST("/logout", authHandler.PostLogout)
	r.POST("/register", authLimiter, authHandler.PostRegister)

	private := r.Group("/")
	private.Use(authMW.RequireAuth())

	// Session Handshake
	private.GET("/me", authHandler.GetMe)
	
	// Users
	private.GET("/users/:id/iwq-trend", teamHandler.GetUserIWQTrend)

	// Halaman Dashboard
	private.GET("/dashboard", notImplemented("GET /dashboard"))

	// Halaman Journal
	private.GET("/journals", notImplemented("GET /journals"))

	// Halaman New Journal
	private.GET("/journals/new", notImplemented("GET /journals/new"))

	// Submit New Journal
	private.POST("/journals", journalHandler.CreateJournal)

	// Get Single Journal Detail
	private.GET("/journals/:id", journalHandler.GetJournal)

	// Halaman Edit Journal
	private.GET("/journals/:id/edit", notImplemented("GET /journals/:id/edit"))

	// Submit Edit Journal
	private.POST("/journals/:id", journalHandler.UpdateJournal)

	// Delete Journal
	private.DELETE("/journals/:id", journalHandler.DeleteJournal)

	// Journal Tags
	private.GET("/journals/:id/tags", tagHandler.GetTagsByJournal)
	private.POST("/journals/:id/tags", tagHandler.AddTagToJournal)
	private.DELETE("/journals/:id/tags/:tagId", tagHandler.RemoveTagFromJournal)

	// Journal Achievements
	private.GET("/journals/:id/achievements", achievementHandler.GetAchievementsByJournal)

	// Journal Attachments
	private.GET("/journals/:id/attachments", journalHandler.GetAttachmentsByJournal)

	// Files
	r.GET("/files/*key", journalHandler.GetFile)

	// Tags
	private.POST("/tags", tagHandler.CreateTag)
	private.GET("/tags", tagHandler.ListTags)
	private.DELETE("/tags/:id", tagHandler.DeleteTag)

	// Achievements
	private.POST("/achievements", achievementHandler.CreateAchievement)
	private.GET("/achievements", achievementHandler.ListAchievements)
	private.GET("/achievements/:id", achievementHandler.GetAchievement)
	private.PUT("/achievements/:id", achievementHandler.UpdateAchievement)
	private.DELETE("/achievements/:id", achievementHandler.DeleteAchievement)
	private.GET("/achievements/:id/journals", achievementHandler.GetJournalsByAchievement)
	private.POST("/achievements/:id/journals", achievementHandler.LinkJournalToAchievement)
	private.DELETE("/achievements/:id/journals/:journalId", achievementHandler.UnlinkJournalFromAchievement)

	// Search
	private.GET("/search/journals", searchHandler.SearchJournals)
	private.GET("/search/achievements", searchHandler.SearchAchievements)

	// Team Management & Manager Calibration Overview
	private.POST("/teams", teamHandler.CreateTeam)
	private.GET("/teams/overview", authMW.RequireRole("manager", "admin"), teamHandler.GetTeamOverview)
	
	// Foundation Work Recognitions
	private.POST("/teams/recognitions", authMW.RequireRole("manager", "admin"), recognitionHandler.CreateRecognition)
	private.GET("/recognitions", recognitionHandler.GetMyRecognitions)

	// Calibration Notes (Manager-Private)
	private.PUT("/teams/notes", authMW.RequireRole("manager", "admin"), calibrationHandler.UpsertCalibrationNote)
	private.GET("/teams/notes", authMW.RequireRole("manager", "admin"), calibrationHandler.GetCalibrationNotes)
	private.DELETE("/teams/notes/:id", authMW.RequireRole("manager", "admin"), calibrationHandler.DeleteCalibrationNote)

	// KPI Periods
	private.POST("/kpi-periods", kpiHandler.CreateKPIPeriod)
	private.GET("/kpi-periods", kpiHandler.ListKPIPeriods)
	private.GET("/kpi-periods/active", kpiHandler.GetActiveKPIPeriod)
	private.GET("/kpi-periods/:id", kpiHandler.GetKPIPeriod)

	// AI Synthesis
	private.POST("/ai/synthesize", aiHandler.PostSynthesize)
}

func notImplemented(route string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.JSON(http.StatusNotImplemented, gin.H{
			"message": "route is registered but not implemented yet",
			"route":   route,
		})
	}
}
