package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/textproto"
	"os"

	"journal_app/internal/db"
	"journal_app/internal/repository"
	"journal_app/internal/service"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type mockFile struct {
	name    string
	content []byte
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// 1. Setup DB
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	dbSSL := os.Getenv("DB_SSLMODE")
	if dbSSL == "" {
		dbSSL = "disable"
	}
	cred := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", dbUser, dbPass, dbHost, dbPort, dbName, dbSSL)

	pool, err := pgxpool.New(context.Background(), cred)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	queries := db.New(pool)

	// 2. Setup Storage
	storageEndpoint := os.Getenv("RUSTFS_ENDPOINT")
	storageAccessKey := os.Getenv("RUSTFS_ACCESS_KEY")
	storageSecretKey := os.Getenv("RUSTFS_SECRET_KEY")
	storageBucket := os.Getenv("RUSTFS_BUCKET")

	storageSvc, err := service.NewStorageService(context.Background(), storageEndpoint, storageAccessKey, storageSecretKey, storageBucket)
	if err != nil {
		log.Fatalf("Unable to initialize StorageService: %v", err)
	}

	// 3. Setup Service
	journalRepo := repository.NewJournalRepository(queries)
	journalSvc := service.NewJournalService(journalRepo, storageSvc)

	// 4. Create dummy request
	// First, need a user in the DB. We assume user ID 1 exists.
	ctx := context.WithValue(context.Background(), "user_id", "1")

	// Create a dummy multipart file
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", `form-data; name="attachments"; filename="test_image.png"`)
	h.Set("Content-Type", "image/png")
	part, err := writer.CreatePart(h)
	if err != nil {
		log.Fatal(err)
	}
	// Valid 1x1 PNG image
	validPNG := []byte{137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, 220, 204, 89, 231, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130}
	io.Copy(part, bytes.NewReader(validPNG))
	writer.Close()

	// Parse it back to get *multipart.FileHeader
	reader := multipart.NewReader(body, writer.Boundary())
	form, err := reader.ReadForm(10 << 20)
	if err != nil {
		log.Fatal(err)
	}
	attachments := form.File["attachments"]

	fmt.Println("Testing CreateJournal with attachment...")
	journal, err := journalSvc.CreateJournal(
		ctx,
		"Test Journal with Attachment",
		"Did some testing",
		"Learned multipart parsing",
		"development",
		"none",
		"more tests",
		"private",
		"2026-08-29",
		attachments,
	)

	if err != nil {
		log.Fatalf("Failed to create journal: %v", err)
	}

	fmt.Printf("Success! Journal created with ID: %d\n", journal.ID)
}
