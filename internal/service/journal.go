package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"time"

	"journal_app/internal/db"
	"journal_app/internal/helper"
	"journal_app/internal/repository"
)

var (
	ErrJournalTitleRequired    = errors.New("title is required")
	ErrJournalDidTodayRequired = errors.New("did_today is required")
	ErrJournalCategoryRequired = errors.New("category is required")
)

type JournalService struct {
	repository *repository.JournalRepository
	storageSvc *StorageService
}

func NewJournalService(repository *repository.JournalRepository, storageSvc *StorageService) *JournalService {
	return &JournalService{
		repository: repository,
		storageSvc: storageSvc,
	}
}

func (s *JournalService) CreateJournal(
	ctx context.Context,
	title string,
	didToday string,
	learnedToday string,
	category string,
	blockers string,
	nextPlan string,
	visibility string,
	entryDate string,
	attachments []*multipart.FileHeader,
) (db.Journal, error) {
	journal, err := s.repository.Create(ctx, title, didToday, learnedToday, category, blockers, nextPlan, visibility, entryDate)
	if err != nil {
		return journal, err
	}

	for _, fileHeader := range attachments {
		file, err := fileHeader.Open()
		if err != nil {
			return journal, fmt.Errorf("failed to open attachment %s: %w", fileHeader.Filename, err)
		}

		// Calculate SHA-256 Checksum and read data
		hasher := sha256.New()
		data, err := io.ReadAll(io.TeeReader(file, hasher))
		file.Close() // Close immediately after reading
		if err != nil {
			return journal, fmt.Errorf("failed to read attachment %s: %w", fileHeader.Filename, err)
		}
		checksum := hex.EncodeToString(hasher.Sum(nil))

		// Naming: <user_id>/<journal_id>/<timestamp>_<filename>
		timestamp := time.Now().Unix()
		storageKey := fmt.Sprintf("%d/%d/%d_%s", journal.UserID, journal.ID, timestamp, fileHeader.Filename)
		contentType := fileHeader.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		// Upload to S3
		err = s.storageSvc.UploadFile(ctx, storageKey, data, contentType)
		if err != nil {
			return journal, fmt.Errorf("failed to upload attachment %s to storage: %w", fileHeader.Filename, err)
		}

		// Generate and upload thumbnail
		thumbnailKey := fmt.Sprintf("%d/%d/thumbs/%d_%s.jpg", journal.UserID, journal.ID, timestamp, fileHeader.Filename)
		thumbData, thumbErr := helper.GenerateThumbnail(data, 400, 400)
		if thumbErr == nil {
			err = s.storageSvc.UploadFile(ctx, thumbnailKey, thumbData, "image/jpeg")
			if err != nil {
				return journal, fmt.Errorf("failed to upload thumbnail %s to storage: %w", fileHeader.Filename, err)
			}
		} else {
			// If we fail to generate thumbnail (e.g. invalid image data), we can choose to leave thumbnailKey empty
			thumbnailKey = ""
		}

		// Save to DB
		_, err = s.repository.CreateAttachment(
			ctx,
			journal.ID,
			storageKey, // using storageKey as file_path for now
			fileHeader.Filename,
			contentType,
			int(fileHeader.Size),
			storageKey,
			thumbnailKey,
			checksum,
		)
		if err != nil {
			return journal, fmt.Errorf("failed to save attachment metadata for %s: %w", fileHeader.Filename, err)
		}
	}

	return journal, nil
}

func (s *JournalService) UpdateJournal(
	ctx context.Context,
	id int32,
	title string,
	didToday string,
	learnedToday string,
	category string,
	blockers string,
	nextPlan string,
	visibility string,
	attachments []*multipart.FileHeader,
	deletedAttachmentIDs []int32,
) (db.Journal, error) {
	journal, err := s.repository.Update(ctx, id, title, didToday, learnedToday, category, blockers, nextPlan, visibility)
	if err != nil {
		return journal, err
	}

	for _, attachmentID := range deletedAttachmentIDs {
		err = s.repository.DeleteAttachment(ctx, attachmentID, id)
		if err != nil {
			return journal, fmt.Errorf("failed to delete attachment %d: %w", attachmentID, err)
		}
	}

	for _, fileHeader := range attachments {
		file, err := fileHeader.Open()
		if err != nil {
			return journal, fmt.Errorf("failed to open attachment %s: %w", fileHeader.Filename, err)
		}

		// Calculate SHA-256 Checksum and read data
		hasher := sha256.New()
		data, err := io.ReadAll(io.TeeReader(file, hasher))
		file.Close() // Close immediately after reading
		if err != nil {
			return journal, fmt.Errorf("failed to read attachment %s: %w", fileHeader.Filename, err)
		}
		checksum := hex.EncodeToString(hasher.Sum(nil))

		// Naming: <user_id>/<journal_id>/<timestamp>_<filename>
		timestamp := time.Now().Unix()
		storageKey := fmt.Sprintf("%d/%d/%d_%s", journal.UserID, journal.ID, timestamp, fileHeader.Filename)
		contentType := fileHeader.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		// Upload to S3
		err = s.storageSvc.UploadFile(ctx, storageKey, data, contentType)
		if err != nil {
			return journal, fmt.Errorf("failed to upload attachment %s to storage: %w", fileHeader.Filename, err)
		}

		// Generate and upload thumbnail
		thumbnailKey := fmt.Sprintf("%d/%d/thumbs/%d_%s.jpg", journal.UserID, journal.ID, timestamp, fileHeader.Filename)
		thumbData, thumbErr := helper.GenerateThumbnail(data, 400, 400)
		if thumbErr == nil {
			err = s.storageSvc.UploadFile(ctx, thumbnailKey, thumbData, "image/jpeg")
			if err != nil {
				return journal, fmt.Errorf("failed to upload thumbnail %s to storage: %w", fileHeader.Filename, err)
			}
		} else {
			thumbnailKey = ""
		}

		// Save to DB
		_, err = s.repository.CreateAttachment(
			ctx,
			journal.ID,
			storageKey,
			fileHeader.Filename,
			contentType,
			int(fileHeader.Size),
			storageKey,
			thumbnailKey,
			checksum,
		)
		if err != nil {
			return journal, fmt.Errorf("failed to save attachment metadata for %s: %w", fileHeader.Filename, err)
		}
	}

	return journal, nil
}

func (s *JournalService) DeleteJournal(ctx context.Context, id int32) error {
	return s.repository.SoftDelete(ctx, id)
}

func (s *JournalService) GetAttachmentsByJournal(ctx context.Context, journalID int32) ([]db.JournalAttachment, error) {
	return s.repository.GetAttachmentsByJournal(ctx, journalID)
}

func (s *JournalService) GetAttachmentFile(ctx context.Context, storageKey string) ([]byte, error) {
	return s.storageSvc.DownloadFile(ctx, storageKey)
}
