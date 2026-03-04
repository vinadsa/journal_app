package service

import (
	"context"
	"errors"

	"journal_app/internal/db"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

type AuthService struct {
	queries *db.Queries
}

// Konstruktor untuk AuthService
func NewAuthService(queries *db.Queries) *AuthService {
	return &AuthService{queries: queries}
}

func (s *AuthService) Login(ctx context.Context, email, password string) (db.User, error) {
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.User{}, ErrInvalidCredentials
		}
		return db.User{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return db.User{}, ErrInvalidCredentials
	}

	return user, nil
}

func (s *AuthService) Register(ctx context.Context, name, email, password string) (db.User, error) {
	// Cek apakah email sudah terdaftar
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err == nil {
		return db.User{}, errors.New("email already registered")
	}

	// generate password hash
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return db.User{}, err
	}

	// Simpan user baru ke database
	user, err = s.queries.CreateUser(ctx, db.CreateUserParams{
		Name:         name,
		Email:        email,
		PasswordHash: string(passwordHash),
	})
	if err != nil {
		return db.User{}, err
	}

	return user, nil
}
