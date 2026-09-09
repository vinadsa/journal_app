package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	// --- Structured Logger Initialization ---
	// Production: JSON handler for log aggregators (Datadog, Loki, CloudWatch)
	// Development: Human-readable text handler
	appEnv := os.Getenv("APP_ENV")
	var logHandler slog.Handler
	if appEnv == "production" {
		logHandler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	} else {
		logHandler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
	}
	slog.SetDefault(slog.New(logHandler))

	if err := godotenv.Load(); err != nil {
		slog.Info("No .env file found, using system environment variables")
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
		slog.Error("Unable to connect to database", "error", err)
		os.Exit(1)
	}

	queries := db.New(pool)

	authService := service.NewAuthService(queries)
	authMW := middleware.NewAuthMiddleware(queries)
	authHandler := handler.NewAuthHandler(authService, authMW)

	// Storage Service
	storageEndpoint := os.Getenv("RUSTFS_ENDPOINT")
	storageAccessKey := os.Getenv("RUSTFS_ACCESS_KEY")
	storageSecretKey := os.Getenv("RUSTFS_SECRET_KEY")
	storageBucket := os.Getenv("RUSTFS_BUCKET")

	storageSvc, err := service.NewStorageService(context.Background(), storageEndpoint, storageAccessKey, storageSecretKey, storageBucket)
	if err != nil {
		slog.Error("Unable to initialize StorageService", "error", err)
		os.Exit(1)
	}
	if err := storageSvc.CreateBucketIfNotExists(context.Background()); err != nil {
		slog.Warn("Failed to ensure bucket exists", "error", err)
	}

	journalService := service.NewJournalService(repository.NewJournalRepository(queries), storageSvc)
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

	// KPI Periods
	kpiRepo := repository.NewKPIRepository(queries)
	kpiService := service.NewKPIService(kpiRepo)
	kpiHandler := handler.NewKPIHandler(kpiService)

	// AI Synthesis (Gemini API)
	geminiAPIKey := os.Getenv("GEMINI_API_KEY")
	if geminiAPIKey == "" {
		slog.Warn("GEMINI_API_KEY is not set — AI synthesis will not work")
	}
	aiService := service.NewAIService(geminiAPIKey)
	aiHandler := handler.NewAIHandler(aiService)

	// --- Gin Engine Setup ---
	// Use gin.New() instead of gin.Default() to replace the default
	// logger with our structured slog-based logger middleware.
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.StructuredLogger())

	// 1. Configure trusted proxies to loopback
	if err := r.SetTrustedProxies([]string{"127.0.0.1", "::1"}); err != nil {
		slog.Warn("Failed to set trusted proxies", "error", err)
	}

	handler.RegisterRoutes(r, authHandler, authMW, journalHandler, teamHandler,
		achievementHandler, tagHandler, searchHandler, kpiHandler, aiHandler)

	// 2. Deep Healthcheck endpoint (probes PostgreSQL database connectivity)
	r.GET("/health", func(ctx *gin.Context) {
		pingCtx, cancel := context.WithTimeout(ctx.Request.Context(), 2*time.Second)
		defer cancel()

		dbErr := pool.Ping(pingCtx)
		status := "ok"
		httpCode := http.StatusOK
		dbStatus := "connected"

		if dbErr != nil {
			status = "degraded"
			dbStatus = fmt.Sprintf("disconnected: %v", dbErr)
			httpCode = http.StatusServiceUnavailable
		}

		ctx.JSON(httpCode, gin.H{
			"status":    status,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"version":   "1.0.0",
			"services": gin.H{
				"database": dbStatus,
			},
		})
	})

	appPort := os.Getenv("APP_PORT")
	if appPort == "" {
		appPort = "8080"
	}

	// 3. HTTP Server configuration with timeouts
	srv := &http.Server{
		Addr:         ":" + appPort,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 4. Background session cleanup worker (prunes expired sessions hourly)
	stopCleanup := make(chan struct{})
	cleanupTicker := time.NewTicker(1 * time.Hour)
	go func() {
		// Run initial cleanup on startup
		cleanCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		_ = queries.CleanExpiredSessions(cleanCtx)
		cancel()

		for {
			select {
			case <-cleanupTicker.C:
				ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
				if err := queries.CleanExpiredSessions(ctx); err != nil {
					slog.Warn("Failed to clean expired sessions", "error", err)
				}
				cancel()
			case <-stopCleanup:
				cleanupTicker.Stop()
				return
			}
		}
	}()

	// 5. Start server in separate goroutine for graceful shutdown
	go func() {
		slog.Info("TRACE Server started", "port", appPort, "pid", os.Getpid(), "env", appEnv)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server error", "error", err)
			os.Exit(1)
		}
	}()

	// 6. Graceful shutdown handler
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	sig := <-quit
	slog.Info("Received shutdown signal", "signal", sig.String())

	close(stopCleanup)

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Closing database connection pool")
	pool.Close()
	slog.Info("TRACE Server exited cleanly")
}
