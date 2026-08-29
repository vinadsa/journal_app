package service

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type StorageService struct {
	client *s3.Client
	bucket string
}

func NewStorageService(ctx context.Context, endpoint, accessKey, secretKey, bucket string) (*StorageService, error) {
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:           endpoint,
			SigningRegion: "us-east-1",
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithEndpointResolverWithOptions(customResolver),
		config.WithRegion("us-east-1"),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = true // Required for S3 clones like MinIO/rustfs
	})

	return &StorageService{
		client: client,
		bucket: bucket,
	}, nil
}

// CreateBucketIfNotExists creates a bucket if it doesn't already exist.
func (s *StorageService) CreateBucketIfNotExists(ctx context.Context) error {
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(s.bucket),
	})
	if err != nil {
		// Bucket doesn't exist (or we don't have access), try to create it
		_, errCreate := s.client.CreateBucket(ctx, &s3.CreateBucketInput{
			Bucket: aws.String(s.bucket),
		})
		if errCreate != nil {
			return fmt.Errorf("failed to create bucket: %w", errCreate)
		}
	}
	return nil
}

// UploadFile uploads a file to the configured bucket.
func (s *StorageService) UploadFile(ctx context.Context, objectKey string, data []byte, contentType string) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(objectKey),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("failed to upload object: %w", err)
	}
	return nil
}

// DownloadFile downloads a file from the configured bucket.
func (s *StorageService) DownloadFile(ctx context.Context, objectKey string) ([]byte, error) {
	out, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to download object: %w", err)
	}
	defer out.Body.Close()

	return io.ReadAll(out.Body)
}
