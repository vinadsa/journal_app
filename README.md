<div align="center">

# TRACE

### *Every contribution, traced.*

**Work Journal & Career Evidence Archive**

[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat-square&logo=go)](https://golang.org)
[![Gin Framework](https://img.shields.io/badge/Gin-v1.12-008ECF?style=flat-square&logo=gin)](https://gin-gonic.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org)

<br />

TRACE is a work journal and career evidence archive designed for engineers and managers to document daily contributions, surface essential foundation work, and prepare for performance reviews with concrete supporting evidence.

</div>

---

## Table of Contents

- [The Core Problems](#the-core-problems)
- [Product Approach](#product-approach)
- [Key Features](#key-features)
  - [Work Logging & Achievement Linking](#work-logging--achievement-linking)
  - [Foundation Work Tracking (IWQ)](#foundation-work-tracking-iwq)
  - [Review Pack & 1-on-1 Preparation](#review-pack--1-on-1-preparation)
  - [AI Review Summaries](#ai-review-summaries)
  - [Search & Filtering](#search--filtering)
  - [Team Overview & Calibration](#team-overview--calibration)
  - [Interface & Themes](#interface--themes)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
  - [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
  - [Manual Local Setup](#manual-local-setup)
- [Demo Accounts](#demo-accounts)
- [Development Commands](#development-commands)
- [License](#license)

---

## The Core Problems

Performance evaluations and career discussions often run into common friction points:

| Problem | Description | How TRACE Helps |
| :--- | :--- | :--- |
| **Contribution Amnesia** | High-impact work delivered months ago is easily forgotten by review season. | Provides continuous, lightweight logging organized by date, tags, and KPI periods. |
| **Recency Bias** | Reviews and 1-on-1s tend to disproportionately focus on the last few weeks of activity. | Maintains a 365-day Activity Calendar and period-based timelines that show consistency over time. |
| **Invisible Work** | Essential foundation tasks (refactoring, incident response, mentoring, runbooks) often go unrecognized. | Surfaces foundation work alongside feature work using the Invisible Work Quotient (IWQ). |
| **Lack of Evidence** | Difficulty recalling specific PRs, documents, and outcomes when discussing promotions or compensation. | Connects daily journal entries directly to major achievements for clear context. |

---

## Product Approach

```
         NOT A DIARY                 NOT A KPI TRACKER             NOT A TASK MANAGER
   (No daily mood trackers      (No corporate surveillance,       (No to-do lists, kanban boards,
    or personal life blogs)      or vanity burndown metrics)        or checklist clones)
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │                TRACE                 │
                      │     Work Journal & Career Archive    │
                      └──────────────────────────────────────┘
```

- **Built for the Individual First:** Centered on the practitioner's perspective, helping individuals keep a reliable record of their professional growth and contributions.
- **Evidence Over Narrative:** Major milestones are backed by linked daily entries rather than unsupported claims.
- **Grounded Terminology:** Uses clear, practical terms (`Work Completed`, `Learnings & Insights`, `Blockers & Challenges`, `Next Steps`, `Achievements`) rather than complex corporate jargon.

---

## Key Features

### Work Logging & Achievement Linking
- Record daily work, learnings, blockers, and next steps with categories (`development`, `maintenance`, `meeting`, etc.) and tags.
- Link relevant journal entries to major achievements to provide clear, chronological context for delivered outcomes.
- Organize achievements by business importance (`Critical`, `High`, `Medium`, `Low`).

### Foundation Work Tracking (IWQ)
- Highlights essential behind-the-scenes engineering tasks—such as technical debt refactoring, incident triage, mentorship, and runbook documentation.
- The Invisible Work Quotient (IWQ) displays the balance between direct feature deliverables and foundation maintenance over each KPI cycle.
- Includes category distributions and trend sparklines to help visualize non-feature contributions during review discussions.

### Review Pack & 1-on-1 Preparation
- **Review Pack Generator:** Export structured Markdown summaries suitable for pasting into tools like Lattice, Notion, or Docs.
- **Printable PDF Export:** Print or save clean, readable A4 review packets directly from the browser without extra software.
- **Talking Points Copier:** Quickly compile recent work bullets (7, 14, or 30 days) formatted for 1-on-1 check-ins.

### AI Review Summaries
- Optional summarization powered by Google Gemini to condense journal logs into structured review drafts.
- Supports both **English (Professional)** and **Bahasa Indonesia (Formal)**.
- **Bring Your Own Key (BYOK):** Allows users to enter their own Gemini API key stored locally in the browser (`localStorage`), with no server-side persistence. Falls back to server configuration if left blank.

### Search & Filtering
- Search across journals and achievements simultaneously.
- Filter by date range, tags, categories, scope, and achievement importance.
- Keyboard shortcuts for quick access (`Cmd+K` or `/` to focus search, `Esc` to close).

### Team Overview & Calibration
- Dedicated views for managers and team leads (`/team` and `/team/calibrate`).
- Review team member contribution timelines across quarters to support balanced, objective evaluations.
- Add private calibration notes per team member and cycle.
- Send recognitions acknowledging colleagues for foundation work and mentorship.

### Interface & Themes
- Clean, readable typography using Newsreader (serif) for headings and Satoshi (sans-serif) for body text.
- Full support for both **Dark (Obsidian)** and **Light (Parchment)** display themes.

---

## Tech Stack

- **Backend:** Go (Gin web framework, pgx/v5 driver, sqlc for type-safe SQL queries)
- **Frontend:** React 19, Vite, React Router v7, Vanilla CSS custom properties
- **Database:** PostgreSQL 16
- **Storage:** S3-compatible object storage support (RustFS / MinIO / AWS S3) for attachments
- **Deployment:** Docker & Docker Compose with Nginx reverse proxy

---

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- Or locally: Go 1.22+, Node.js 20+, and PostgreSQL 16+

---

### Using Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vinadsa/journal_app.git
   cd journal_app
   ```

2. **Set up the environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Start the application containers:**
   ```bash
   docker compose up -d --build
   ```

4. **Seed the database with demo data:**
   ```bash
   make docker-seed
   ```

5. **Open the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8080](http://localhost:8080)
   - Healthcheck: [http://localhost:8080/health](http://localhost:8080/health)

---

### Manual Local Setup

1. **Install dependencies:**
   ```bash
   # Backend dependencies
   go mod download

   # Frontend dependencies
   cd frontend && npm install && cd ..
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Update database connection details in .env if needed
   ```

3. **Initialize database & seed data:**
   ```bash
   make freshdb
   ```

4. **Run development servers:**
   ```bash
   make dev
   ```
   *Runs Go backend on `:8080` and Vite frontend on `:3000` concurrently.*

---

## Demo Accounts

The seed script provides two test accounts pre-populated with sample entries across multiple quarters:

| Name | Email | Password | Role | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Kevin** | `kevin@test.com` | `password123` | Employee (Senior IC) | Contains entries covering both feature development and foundation work (incident response, refactoring, mentorship). |
| **Sarah** | `sarah@test.com` | `password123` | Manager (Lead) | Includes managerial entries, with access to `/team` and calibration tools. |

---

## Development Commands

Common tasks managed via the `Makefile`:

```bash
# Application
make dev              # Start backend and frontend concurrently
make dev-backend      # Start backend only
make dev-frontend     # Start frontend only

# Database (Local)
make migrate          # Run schema migrations
make seed             # Insert demo seed data
make freshdb          # Drop, recreate, migrate, and seed database
make sqlc             # Regenerate type-safe Go code from sql/

# Database (Docker)
make docker-seed      # Seed running PostgreSQL container
make docker-freshdb   # Reset and reseed running container
```

---

## License

This project is licensed under the [MIT License](LICENSE).
