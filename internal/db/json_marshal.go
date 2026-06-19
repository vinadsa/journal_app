package db

import (
	"encoding/json"
)

// MarshalJSON for NullJournalCategory
func (n NullJournalCategory) MarshalJSON() ([]byte, error) {
	if !n.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(n.JournalCategory)
}

func (n *NullJournalCategory) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		n.Valid = false
		return nil
	}
	n.Valid = true
	return json.Unmarshal(data, &n.JournalCategory)
}

// MarshalJSON for NullJournalVisibility
func (n NullJournalVisibility) MarshalJSON() ([]byte, error) {
	if !n.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(n.JournalVisibility)
}

func (n *NullJournalVisibility) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		n.Valid = false
		return nil
	}
	n.Valid = true
	return json.Unmarshal(data, &n.JournalVisibility)
}

// MarshalJSON for NullImportanceLevel
func (n NullImportanceLevel) MarshalJSON() ([]byte, error) {
	if !n.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(n.ImportanceLevel)
}

func (n *NullImportanceLevel) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		n.Valid = false
		return nil
	}
	n.Valid = true
	return json.Unmarshal(data, &n.ImportanceLevel)
}

// MarshalJSON for NullUserRole
func (n NullUserRole) MarshalJSON() ([]byte, error) {
	if !n.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(n.UserRole)
}

func (n *NullUserRole) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		n.Valid = false
		return nil
	}
	n.Valid = true
	return json.Unmarshal(data, &n.UserRole)
}
