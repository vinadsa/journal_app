# Journal App Repositioning Proposal

## Executive Summary

### Current Positioning

Saat ini aplikasi diposisikan sebagai:

> Sistem jurnal kerja harian untuk membantu penyusunan KPI dan dokumentasi pekerjaan.

Masalah dari positioning ini adalah terlalu sempit. KPI hanyalah salah satu output yang dapat dihasilkan dari data yang dikumpulkan.

---

### Proposed Positioning

> Professional Work Intelligence Platform

atau

> Work Journal & Achievement Tracking System

atau

> Evidence-Based Performance Platform

Tujuan utama aplikasi bukan sekadar mencatat pekerjaan harian, tetapi menjadi sistem yang membantu individu dan organisasi mendokumentasikan, memahami, membuktikan, dan mengembangkan kontribusi kerja secara berkelanjutan.

---

## Vision

### Vision Statement

Membantu setiap profesional membangun rekam jejak kontribusi kerja yang terdokumentasi, terukur, dapat dibuktikan, dan mudah direfleksikan sepanjang perjalanan karier mereka.

---

## Core Problems Being Solved

### 1. Contribution Amnesia

Karyawan sering lupa kontribusi yang telah diberikan beberapa bulan lalu.

#### Impact

* Sulit saat performance review
* Sulit saat promotion review
* Sulit memperbarui CV
* Sulit menjelaskan pencapaian kepada manajemen

---

### 2. Recency Bias

Evaluasi sering hanya berdasarkan pekerjaan yang masih segar dalam ingatan.

#### Impact

* Kontribusi lama tidak dihargai
* Penilaian menjadi tidak objektif

---

### 3. Invisible Work

Banyak pekerjaan penting tidak terlihat dalam sistem task management.

Contoh:

* Mentoring
* Incident handling
* Production support
* Research
* Stakeholder communication
* Knowledge sharing

#### Impact

Kontribusi nyata sering tidak tercermin dalam penilaian formal.

---

### 4. Lack of Evidence

Karyawan sering memiliki klaim kontribusi tanpa dokumentasi pendukung.

#### Impact

* Sulit membuktikan performa
* Sulit menyusun achievement report
* Sulit melakukan evaluasi berbasis data

---

# Product Evolution Roadmap

---

# Phase 1 - Better Work Journal ✅ IMPLEMENTED

> **Status**: Fully implemented on 2026-05-31
> **Branch context**: Phase 1 complete. Ready for testing and Phase 2.

## Goal

Mengubah jurnal dari sekadar catatan aktivitas menjadi dokumentasi pekerjaan yang lebih bernilai.

---

## Change 1 - Achievement Tracking ✅

### Implementation

Tabel `achievements` dengan relasi ke `journals`. Setiap journal entry dapat memiliki multiple achievements.

```
achievements
├── journal_id (FK → journals)
├── user_id (FK → users)
├── title (required)
├── description (optional)
├── impact (optional)        ← Impact diletakkan di sini, bukan di journals
├── importance (enum: low/medium/high/critical)
├── achieved_date (optional)
├── created_at
└── updated_at
```

### Keputusan Implementasi

* **Impact diletakkan di `achievements`**, bukan di `journals`. Alasan: impact lebih relevan per-achievement, satu journal bisa punya beberapa pekerjaan dengan dampak berbeda.
* **`importance_level` enum** diletakkan di `achievements`, bukan `journals`. Alasan: mengurangi cognitive load saat mengisi jurnal harian, user hanya perlu menilai importance saat mendokumentasikan achievement spesifik.
* **`achievement_evidence` table ditunda** — memanfaatkan relasi `journal_attachments` yang sudah ada (achievement → journal → attachments).
* **`achievement_summary` field di journals tidak ditambahkan** — redundan, bisa di-derive dari relasi.

### API Endpoints

```
POST   /achievements              — Create (linked to journal)
GET    /achievements              — List user achievements (paginated)
GET    /achievements/:id          — Get single
PUT    /achievements/:id          — Update
DELETE /achievements/:id          — Delete
GET    /journals/:id/achievements — Get achievements for a journal
```

---

## Change 2 - Impact Documentation ✅

### Implementation

Field `impact` ada di tabel `achievements` (lihat Change 1 di atas). Bukan sebagai field terpisah di `journals`.

### Why (tetap sama)

Membantu menghubungkan pekerjaan dengan nilai bisnis.

---

## Change 3 - Tags ✅

### Implementation

Dua tabel baru: `tags` (master data) dan `journal_tags` (many-to-many pivot).

```
tags
├── id (auto-identity)
├── name (unique, auto-lowercased)
└── created_at

journal_tags
├── journal_id (FK → journals, CASCADE)
├── tag_id (FK → tags, CASCADE)
└── UNIQUE(journal_id, tag_id)
```

### API Endpoints

```
POST   /tags                        — Create tag
GET    /tags                        — List all tags
DELETE /tags/:id                    — Delete tag
POST   /journals/:id/tags           — Attach tag to journal
DELETE /journals/:id/tags/:tagId    — Detach tag from journal
GET    /journals/:id/tags           — Get tags for a journal
```

---

## Change 4 - Rich Search ✅

### Implementation

Single search endpoint yang melakukan query across journals, tags, dan achievements.

```
GET /search/journals?keyword=&category=&tag=&date_from=&date_to=&limit=&offset=
```

Search melakukan ILIKE match pada:
* `journals.title`
* `journals.did_today`
* `journals.learned_today`
* `achievements.title`
* `achievements.impact`

Dan filter by:
* `category` (exact match enum)
* `tag` (exact match tag name)
* `date_from` / `date_to` (date range)

---

## Database State After Phase 1

### New Tables

```
tags                 — master data tag
journal_tags         — many-to-many pivot (journal ↔ tag)
achievements         — achievement records with impact & importance
```

### New Enum Type

```
importance_level: low | medium | high | critical
```

### New Indexes

```
idx_journal_tags_journal  — journal_tags(journal_id)
idx_journal_tags_tag      — journal_tags(tag_id)
idx_achievements_journal  — achievements(journal_id)
idx_achievements_user     — achievements(user_id)
idx_achievements_date     — achievements(user_id, achieved_date DESC)
```

### Existing Tables (modified)

```
journals             — Removed UNIQUE constraint on (user_id, entry_date)
journal_kpi_summary  — View updated to count(DISTINCT entry_date)
```

### Existing Tables (unchanged)

```
teams, users, journal_attachments, kpi_periods
```

---

## Architecture After Phase 1

Layer pattern (consistent across all features):

```
Handler (HTTP) → Service (Business Logic) → Repository (Data Access) → DB (sqlc-generated)
```

### New Files Created

```
internal/repository/achievement.go
internal/repository/tag.go
internal/repository/search.go
internal/service/achievement.go
internal/service/tag.go
internal/service/search.go
internal/handler/achievement.go
internal/handler/tag.go
internal/handler/search.go
```

### Modified Files

```
sql/schema.sql          — 3 new tables + enum + indexes + trigger
sql/query.sql           — ~140 lines of new queries
internal/handler/routes.go   — new routes registered
cmd/server/main.go           — new repos/services/handlers wired
```

### Testing Resources

```
sql/seed.sql             — test data (2 users, 6 journals, 7 tags, 4 achievements)
api_testing_guide.md     — curl commands for all endpoints
```

---

# Phase 2 - Performance Intelligence 🔲 NOT STARTED

## Goal

Mengubah data jurnal menjadi insight.

---

## Change 5 - Monthly Accomplishment Generator

### Output Example

May 2026 Summary

* 24 journal entries
* 3 major achievements
* 2 incidents resolved
* Main focus: Backend Development

### Why

Mengurangi pekerjaan manual saat review.

### Potential

Monthly reporting automation.

---

## Change 6 - Quarterly Contribution Report

### Output Example

Q2 Highlights

* Led database migration
* Built attachment system
* Improved deployment process

### Why

Membantu appraisal dan evaluasi berkala.

### Potential

Performance review assistant.

---

## Change 7 - Manager Dashboard

### Features

Manager dapat melihat:

* Team achievements
* Team blockers
* Team workload trends
* Contribution summaries

### Why

Manager sering kesulitan mengingat kontribusi seluruh anggota tim.

### Potential

Data-driven people management.

---

## Change 8 - KPI Evidence Linking

### New Entity

```text
kpi_items
```

### Relationship

```text
KPI
 └── linked journals
      └── linked achievements
```

### Why

Menghubungkan KPI dengan bukti nyata.

### Potential

Evidence-based KPI evaluation.

---

# Phase 3 - Career Intelligence 🔲 NOT STARTED

## Goal

Membantu pengembangan karier individu.

---

## Change 9 - Skill Extraction

### Example

System detects:

* PostgreSQL
* Docker
* Kubernetes
* Golang

based on journal history.

### Why

Memberikan gambaran perkembangan kompetensi.

### Potential

Personal growth tracking.

---

## Change 10 - Learning Timeline

Source:

```text
learned_today
```

### Output

Learning Progress

2025

* Docker
* CI/CD
* PostgreSQL Optimization

2026

* Kubernetes
* Observability
* System Design

### Why

Menampilkan pertumbuhan profesional.

### Potential

Career development reports.

---

## Change 11 - Promotion Portfolio

Automatically generate:

### Contributions

### Achievements

### Impacts

### Leadership Activities

### Why

Banyak organisasi meminta dokumen seperti ini saat promosi.

### Potential

Promotion readiness assessment.

---

## Change 12 - Resume Achievement Generator

Generate:

* Resume bullet points
* Career highlights
* Project summaries

based on journal history.

### Why

CV biasanya dibuat dengan mengandalkan ingatan.

### Potential

Career mobility support.

---

# Phase 4 - Organizational Knowledge Layer 🔲 NOT STARTED

## Goal

Mengubah jurnal individu menjadi aset organisasi.

---

## Change 13 - Knowledge Base Extraction

Examples:

* Troubleshooting guides
* Migration lessons learned
* Incident retrospectives

Generated from journals.

### Why

Pengetahuan sering hilang ketika karyawan keluar.

### Potential

Knowledge retention.

---

## Change 14 - Team Historical Timeline

View:

2025 Q4

* Migration Project
* Infrastructure Upgrade
* Authentication Revamp

### Why

Membantu memahami sejarah organisasi.

### Potential

Institutional memory.

---

## Change 15 - Cross-Team Visibility

Allow controlled visibility of:

* Achievements
* Lessons learned
* Best practices

### Why

Mengurangi knowledge silo.

### Potential

Organization-wide learning.

---

# Database Enhancement Status

## Implemented (Phase 1)

| Table | Status |
|-------|--------|
| `achievements` | ✅ Implemented |
| `tags` | ✅ Implemented |
| `journal_tags` | ✅ Implemented |

| Enum | Status |
|------|--------|
| `importance_level` | ✅ On `achievements` table |

## Database Constraints Changes

| Change | Status | Reason |
|--------|--------|--------|
| Dropped `journals_user_id_entry_date_key` | ✅ Implemented | Allows event-driven journaling (multiple journals per day) |
| Updated `journal_kpi_summary` | ✅ Implemented | Switched `total_entries` counting to `DISTINCT entry_date` to prevent metric inflation from multiple daily entries |

## Deferred / Not Implemented / Removed

| Item | Status | Reason |
|------|--------|--------|
| `achievement_evidence` | ⏸️ Deferred | Using `journal_attachments` via journal relation |
| `impact` field on `journals` | ❌ Rejected | Placed on `achievements` instead |
| `achievement_summary` on `journals` | ❌ Rejected | Derivable from relations |
| `importance_level` on `journals` | ❌ Rejected | On `achievements` to reduce daily friction |
| `kpi_items` | 🔲 Phase 2 | |
| `kpi_evidence_links` | 🔲 Phase 2 | |
| `skills` | 🔲 Phase 3 | |
| `user_skills` | 🔲 Phase 3 | |
| `tasks_completed` on `journals` | ❌ Removed | Not a good indicator for KPI |
| `hours_worked` on `journals` | ❌ Removed | Not a good indicator for KPI |

---

# Revised Product Statement

## Before

"Aplikasi jurnal kerja untuk membantu pencatatan aktivitas dan penyusunan KPI."

## After

"Platform dokumentasi kontribusi kerja yang membantu individu dan organisasi membangun rekam jejak pencapaian, pembelajaran, dampak bisnis, dan bukti performa secara berkelanjutan."

---

# Long-Term Outcome

Jika visi ini berhasil diwujudkan, aplikasi tidak lagi menjadi sekadar jurnal harian.

Aplikasi akan menjadi:

* Professional Memory System
* Achievement Repository
* Evidence-Based Performance Platform
* Career Growth Tracker
* Organizational Knowledge Archive

Dengan kata lain, aplikasi menjadi sumber kebenaran utama mengenai apa yang telah dikerjakan, dipelajari, dicapai, dan dibuktikan oleh seseorang maupun sebuah tim sepanjang waktu.

---

### Strategis dari saya: jangan langsung membangun semua fitur di atas.

Dari pengalaman banyak produk internal, nilai terbesar biasanya muncul dari urutan berikut:

Work Journal yang sangat mudah diisi (fondasi)
Achievement & Impact Tracking
Monthly/Quarterly Summary Generator
Performance Review Generator
Baru kemudian analytics, skill extraction, dan knowledge management.

Jika saya melihat schema Anda saat ini, Anda sebenarnya sudah berada sekitar 60–70% jalan menuju fondasi yang benar. Tantangan terbesar berikutnya bukan database, melainkan memastikan pengguna mau mengisi jurnal secara konsisten dalam waktu berbulan-bulan. Tanpa data yang konsisten, seluruh visi "professional memory system" tidak akan memiliki bahan bakar untuk menghasilkan insight yang bernilai.