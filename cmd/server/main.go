package main

import (
	"context"
	"log"

	"journal_app/internal/db"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cred := "postgres://postgres:postgres@localhost:5432/journal"

	pool, err := pgxpool.New(context.Background(), cred)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}

	queries := db.New(pool)

	_ = queries

	r := gin.Default()

	r.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"status": "ok",
		})
	}) 
	
	if err := r.Run(":8001"); err != nil {
		log.Fatalf("Unable to start server: %v\n", err)
	}
} 