package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"journal_app/internal/db"
	"journal_app/internal/handler"
	"journal_app/internal/middleware"
	"journal_app/internal/repository"
	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	dbSSL := os.Getenv("DB_SSLMODE")

	if dbSSL == "" {
		dbSSL = "disable"
	}

	cred := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		dbUser, dbPass, dbHost, dbPort, dbName, dbSSL)

	pool, err := pgxpool.New(context.Background(), cred)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}

	queries := db.New(pool)

	authService := service.NewAuthService(queries)
	authMW := middleware.NewAuthMiddleware()
	authHandler := handler.NewAuthHandler(authService, authMW)

	journalService := service.NewJournalService(repository.NewJournalRepository(queries))
	journalHandler := handler.NewJournalHandler(journalService)

	teamService := service.NewTeamService(queries)
	teamHandler := handler.NewTeamHandler(teamService)

	// Phase 1: Achievement Tracking
	achievementRepo := repository.NewAchievementRepository(queries)
	achievementService := service.NewAchievementService(achievementRepo)
	achievementHandler := handler.NewAchievementHandler(achievementService)

	// Phase 1: Tags
	tagRepo := repository.NewTagRepository(queries)
	tagService := service.NewTagService(tagRepo)
	tagHandler := handler.NewTagHandler(tagService)

	// Phase 1: Rich Search
	searchRepo := repository.NewSearchRepository(queries)
	searchService := service.NewSearchService(searchRepo)
	searchHandler := handler.NewSearchHandler(searchService)

	r := gin.Default()
	handler.RegisterRoutes(r, authHandler, authMW, journalHandler, teamHandler,
		achievementHandler, tagHandler, searchHandler)

	r.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"status": "ok",
		})
	})

	appPort := os.Getenv("APP_PORT")
	if appPort == "" {
		appPort = "8080"
	}

	if err := r.Run(":" + appPort); err != nil {
		log.Fatalf("Unable to start server: %v\n", err)
	}
}
