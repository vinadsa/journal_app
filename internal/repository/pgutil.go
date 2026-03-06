package repository

import (
	"errors"
	"fmt"
	"math"
	"strconv"
	"time"

	"journal_app/internal/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

var ErrTypeConversion = errors.New("type conversion error")

func StringToPgUUID(value string) (pgtype.UUID, error) {
	uid, err := uuid.Parse(value)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("%w: %v", ErrTypeConversion, err)
	}

	var out pgtype.UUID
	copy(out.Bytes[:], uid[:])
	out.Valid = true
	return out, nil
}

func PgUUIDToString(value pgtype.UUID) (string, error) {
	if !value.Valid {
		return "", fmt.Errorf("%w: uuid is null", ErrTypeConversion)
	}

	uid, err := uuid.FromBytes(value.Bytes[:])
	if err != nil {
		return "", fmt.Errorf("%w: invalid pg uuid bytes", ErrTypeConversion)
	}

	return uid.String(), nil
}

func StringToPgText(value string) pgtype.Text {
	return pgtype.Text{String: value, Valid: true}
}

func StringToNullablePgText(value string) pgtype.Text {
	if value == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: value, Valid: true}
}

func IntToPgInt4(value int) (pgtype.Int4, error) {
	if value < math.MinInt32 || value > math.MaxInt32 {
		return pgtype.Int4{}, fmt.Errorf("%w: value %d out of int4 range", ErrTypeConversion, value)
	}
	return pgtype.Int4{Int32: int32(value), Valid: true}, nil
}

func TimeToPgDate(value time.Time) pgtype.Date {
	y, m, d := value.Date()
	return pgtype.Date{
		Time:             time.Date(y, m, d, 0, 0, 0, 0, time.UTC),
		InfinityModifier: pgtype.Finite,
		Valid:            true,
	}
}

func TimeToPgTimestamp(value time.Time) pgtype.Timestamp {
	return pgtype.Timestamp{Time: value.UTC(), Valid: true}
}

func Float64ToPgNumeric(value float64) (pgtype.Numeric, error) {
	return StringToPgNumeric(strconv.FormatFloat(value, 'f', -1, 64))
}

func StringToPgNumeric(value string) (pgtype.Numeric, error) {
	var out pgtype.Numeric
	if err := out.Scan(value); err != nil {
		return pgtype.Numeric{}, fmt.Errorf("%w: invalid numeric value %q", ErrTypeConversion, value)
	}
	return out, nil
}

func StringToNullJournalCategory(value string) db.NullJournalCategory {
	if value == "" {
		return db.NullJournalCategory{}
	}

	return db.NullJournalCategory{
		JournalCategory: db.JournalCategory(value),
		Valid:           true,
	}
}
