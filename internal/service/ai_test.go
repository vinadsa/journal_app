package service

import (
	"context"
	"os"
	"strings"
	"testing"

	"github.com/joho/godotenv"
)

func TestGenerateSynthesisLive(t *testing.T) {
	_ = godotenv.Load("../../.env")
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		t.Skip("GEMINI_API_KEY not set, skipping live test")
	}

	aiSvc := NewAIService(apiKey)

	req := SynthesisRequest{
		Period: "Q3 2026",
		Journals: []SynthesisJournal{
			{
				ID:        1,
				Title:     "Midtrans Gateway Production Cutover",
				Category:  "feature",
				EntryDate: "2026-07-15",
				DidToday:  "Executed cutover for payment service. Migrated 100% of checkout traffic to Midtrans with zero downtime.",
				Impact:    "Enabled instant QRIS and VA payments, dropping payment failure rates by 18%.",
			},
			{
				ID:        2,
				Title:     "P1 Incident Postmortem & Ledger Hardening",
				Category:  "incident",
				EntryDate: "2026-08-02",
				DidToday:  "Triaged duplicate transaction webhook glitch. Implemented idempotent processing and double-entry ledger verification.",
				Blockers:  "Upstream webhook latency spikes.",
				Impact:    "Eliminated risk of duplicate charges; established automated reconciliation runbook.",
			},
			{
				ID:        3,
				Title:     "Junior Engineer Mentorship & Architecture Review",
				Category:  "maintenance",
				EntryDate: "2026-08-20",
				DidToday:  "Mentored 2 junior engineers on distributed tracing and Go concurrency best practices.",
				Impact:    "Onboarded junior devs to on-call rotation ahead of schedule.",
			},
		},
		Achievements: []SynthesisAchievement{
			{
				ID:           1,
				Title:        "Zero-Downtime Payment Gateway Overhaul",
				Description:  "Led payment engine migration affecting $2M monthly GMV.",
				Impact:       "18% drop in failure rates, zero downtime achieved.",
				Importance:   "critical",
				AchievedDate: "2026-07-20",
			},
		},
	}

	res, err := aiSvc.GenerateSynthesis(context.Background(), req, "")
	if err != nil {
		t.Fatalf("GenerateSynthesis failed: %v", err)
	}

	if res.Summary == "" {
		t.Errorf("expected non-empty summary")
	}
	if len(res.TopImpacts) == 0 {
		t.Errorf("expected at least 1 top impact")
	}
	t.Logf("Summary: %s", res.Summary)
	t.Logf("Impacts: %d", len(res.TopImpacts))
	for _, imp := range res.TopImpacts {
		t.Logf(" - [%s]: %s", imp.Title, imp.Description)
	}
}

func TestGenerateSynthesisIndonesian(t *testing.T) {
	_ = godotenv.Load("../../.env")
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		t.Skip("GEMINI_API_KEY not set, skipping live test")
	}

	aiSvc := NewAIService(apiKey)

	req := SynthesisRequest{
		Period:   "Q3 2026",
		Language: "id",
		Journals: []SynthesisJournal{
			{
				ID:        1,
				Title:     "Migrasi Payment Gateway Midtrans",
				Category:  "feature",
				EntryDate: "2026-07-15",
				DidToday:  "Melakukan cutover layanan pembayaran ke Midtrans tanpa downtime.",
				Impact:    "Mengurangi kegagalan transaksi sebesar 18%.",
			},
		},
		Achievements: []SynthesisAchievement{
			{
				ID:           1,
				Title:        "Overhaul Payment Gateway Tanpa Downtime",
				Description:  "Memimpin migrasi engine pembayaran untuk transaksi $2M GMV per bulan.",
				Impact:       "Failure rate turun 18%, nol downtime.",
				Importance:   "critical",
				AchievedDate: "2026-07-20",
			},
		},
	}

	res, err := aiSvc.GenerateSynthesis(context.Background(), req, "")
	if err != nil {
		t.Fatalf("GenerateSynthesis Indonesian failed: %v", err)
	}

	if res.Language != "id" {
		t.Errorf("expected language 'id', got '%s'", res.Language)
	}
	if res.Summary == "" {
		t.Errorf("expected non-empty summary")
	}
	t.Logf("Indonesian Summary: %s", res.Summary)
	t.Logf("Raw Markdown:\n%s", res.RawMarkdown)
}

func TestGenerateSynthesisKeyValidation(t *testing.T) {
	aiSvc := NewAIService("") // No server key configured

	req := SynthesisRequest{
		Period: "Q3 2026",
		Journals: []SynthesisJournal{
			{ID: 1, Title: "Work", EntryDate: "2026-07-15", DidToday: "Done"},
		},
	}

	// 1. Both server key and custom key are missing
	_, err := aiSvc.GenerateSynthesis(context.Background(), req, "")
	if err == nil || !strings.Contains(err.Error(), "Gemini API key is not configured") {
		t.Errorf("expected missing key error, got: %v", err)
	}

	// 2. Custom key is too short
	_, err = aiSvc.GenerateSynthesis(context.Background(), req, "short_key")
	if err == nil || !strings.Contains(err.Error(), "invalid custom Gemini API key format") {
		t.Errorf("expected invalid format error for short key, got: %v", err)
	}

	// 3. Custom key contains forbidden characters (newline / injection)
	_, err = aiSvc.GenerateSynthesis(context.Background(), req, "AIzaSy123456789012345\r\nInjected-Header: evil")
	if err == nil || !strings.Contains(err.Error(), "invalid custom Gemini API key format") {
		t.Errorf("expected invalid format error for injected key, got: %v", err)
	}

	// 4. Custom key contains spaces
	_, err = aiSvc.GenerateSynthesis(context.Background(), req, "AIzaSy123456789012345 with spaces")
	if err == nil || !strings.Contains(err.Error(), "invalid custom Gemini API key format") {
		t.Errorf("expected invalid format error for spaced key, got: %v", err)
	}
}


