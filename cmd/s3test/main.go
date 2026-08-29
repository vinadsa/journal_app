package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"journal_app/internal/service"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found or error loading it")
	}

	endpoint := os.Getenv("RUSTFS_ENDPOINT")
	accessKey := os.Getenv("RUSTFS_ACCESS_KEY")
	secretKey := os.Getenv("RUSTFS_SECRET_KEY")
	bucketName := os.Getenv("RUSTFS_BUCKET")

	ctx := context.Background()

	fmt.Println("Initializing StorageService...")
	storageSvc, err := service.NewStorageService(ctx, endpoint, accessKey, secretKey, bucketName)
	if err != nil {
		log.Fatalf("Failed to initialize StorageService: %v", err)
	}

	fmt.Println("Creating bucket if not exists...")
	err = storageSvc.CreateBucketIfNotExists(ctx)
	if err != nil {
		log.Fatalf("Failed to create bucket: %v", err)
	}

	testFileName := "hello.txt"
	testContent := []byte("Hello from journal_app to rustfs!")
	contentType := "text/plain"

	fmt.Printf("Uploading file: %s...\n", testFileName)
	err = storageSvc.UploadFile(ctx, testFileName, testContent, contentType)
	if err != nil {
		log.Fatalf("Failed to upload file: %v", err)
	}

	fmt.Printf("Downloading file: %s...\n", testFileName)
	downloadedData, err := storageSvc.DownloadFile(ctx, testFileName)
	if err != nil {
		log.Fatalf("Failed to download file: %v", err)
	}

	fmt.Printf("Downloaded content: %s\n", string(downloadedData))

	if string(downloadedData) == string(testContent) {
		fmt.Println("SUCCESS: Upload and Download match!")
	} else {
		fmt.Println("FAILED: Content mismatch.")
	}
}
