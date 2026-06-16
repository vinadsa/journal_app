package service

import "journal_app/internal/db"

type KPIService struct {
	db *db.Queries
}

func NewKPIService(db *db.Queries) *KPIService {
	return &KPIService{
		db: db,
	}
}
