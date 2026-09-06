# Project Context & Agent Operating Rules

## 1. Product Identity & Philosophy

**TRACE** — Professional Work Journal & Career Evidence Archive  
*Tagline / Direction: "Every contribution, traced."*

* **This is NOT a diary application.** (Do not add emotional journaling, daily mood trackers, or personal life logs).
* **This is NOT a KPI tracker.** (Do not build corporate OKR dashboards, vanity burndown charts, or top-down surveillance tools).
* **This is NOT a task manager.** (Do not build to-do lists, kanban boards, or checklist clones).

### The 4 Core Problems TRACE Solves:
1. **Contribution Amnesia:** Forgetting high-impact work delivered 3–6 months ago when review cycles arrive.
2. **Recency Bias:** Performance reviews, 1-on-1s, and appraisals unfairly remembering only the most recent 2 weeks.
3. **Invisible Work:** Unglamorous yet essential contributions (refactoring, tech debt clearance, unblocking colleagues, incident triage, documentation, mentorship) going unmeasured and unrewarded.
4. **Lack of Evidence:** Inability to produce concrete artifacts, metric deltas, PR links, and supporting evidence when asking for promotions, raises, or equity adjustments.

---

## 2. Architecture & Project Structure

```
journal_app/
├── cmd/server/main.go            # Backend entrypoint (Go Gin REST API)
├── internal/
│   ├── db/                       # sqlc-generated pgx/v5 database models & queries
│   ├── handler/                  # HTTP controllers (Gin handlers & routes)
│   ├── service/                  # Business logic layer
│   ├── repository/               # Database repository interfaces & pgx implementations
│   └── middleware/               # Auth & session verification middlewares
├── sql/
│   ├── schema.sql                # PostgreSQL DDL migrations
│   ├── query.sql                 # SQL queries consumed by sqlc
│   └── seed.sql                  # Realistic demo data for seeding
├── frontend/
│   ├── src/
│   │   ├── api/                  # API client functions (fetch wrappers with credentials)
│   │   ├── components/           # Reusable UI components & modals
│   │   ├── context/              # AuthContext & ThemeContext
│   │   ├── lib/                  # Utilities (e.g. dateUtils.js)
│   │   ├── pages/                # Route pages (Dashboard, Review, Journals, Achievements, etc.)
│   │   ├── styles/               # Modular component & page CSS files
│   │   └── index.css             # Global tokens, typography, CSS variables, resets
│   └── package.json              # React 19 + Vite
├── Makefile                      # Standard developer workflow commands
└── AGENTS.md                     # Agent operating rules & context (this document)
```

### Dev Commands:
* **Start Full Dev Environment:** `make dev` (runs backend on `:8080` and frontend on `:3000` concurrently).
* **Database Commands:**
  * `make seed` — Seeds database with rich demo data.
  * `make freshdb` — Drops, creates, migrates, and seeds the PostgreSQL database.
  * `make sqlc` or `sqlc generate` — Re-generates Go type-safe DB code in `internal/db` from `sql/schema.sql` and `sql/query.sql`.

---

## 3. Design Philosophy & Aesthetics ("TRACE" Visual Identity)

### Prioritize:
* **Professional Memory System:** Serious, evidence-backed career archive with editorial gravitas.
* **Personal Career Archive:** Built for the individual professional first, team/manager second.
* **Typography:**
  * **Headings & Display:** `'Newsreader'`, Georgia, serif (scholarly, authoritative, timeless).
  * **Body & General UI:** `'Satoshi'`, system-ui, sans-serif (clean, geometric, highly legible).
  * **Code, Timestamps & Badges:** `'JetBrains Mono'`, monospace.
* **Color Palette:**
  * Primary Accent: Deep Burgundy (`--color-burgundy-900: hsl(348, 83%, 14%)`, `--color-burgundy-800: hsl(348, 75%, 20%)`).
  * Milestone / Achievement Anchors: Rich Gold / Amber (`--color-gold-500: #d97706`, `--color-gold-400: #fbbf24`).
  * Surface & Background:
    * Dark Mode: Deep obsidian/slate canvas (`#0d1117`, `#161b22`, `#21262d`).
    * Light Mode: Warm editorial parchment/linen (`#fbf9f5`, `#f4efe6`, `#eae3d2`).

### Strictly Avoid:
* Generic SaaS tropes (purple-blue linear gradients, neon accents, generic Inter-only typography).
* Bootstrap or Tailwind default templates.
* Notion clones or minimalist blank canvases.
* Childish gamification (XP bars, confetti cannons, streaks as primary drivers).
* Crowded enterprise data grids without visual breathing room.

### Grounded Copywriting & Voice Discipline:
TRACE is a serious, respectful, and grounded career companion — **NOT an intelligence agency, crime laboratory, military radar, or Silicon Valley satire**.

#### 1. Strictly Avoid Pretentious & Melodramatic Tropes:
* ❌ **No Intel / Espionage Terms:** Do NOT use *"Dossier"*, *"Forensic Peek"*, *"Surveillance"*, *"Evidence Vault"*, *"Target Acquisition"*. (Use *"Linked Entries"*, *"Details"*, *"Inspect"*, *"Review"*).
* ❌ **No Sci-Fi / Cyber Radar Tropes:** Do NOT use *"Traces retrieved"*, *"Telemetry detected"*, *"Signal lock"*. (Use *"Results found"*, *"Records"*, *"Contributions"*).
* ❌ **No Buzzword Salad / Corporate Hyperbole:** Do NOT use *"Team multiplier traces"*, *"Code review stewardship"*, *"System friction"*, *"Firefighting contributions"*, *"Invisible architectural enhancements"*. (Use *"Onboarding & mentorship"*, *"Code reviews & unblocking"*, *"Blockers & challenges"*, *"Incidents & hotfixes"*, *"Refactoring & tech debt"*).
* ❌ **No Literary Melodrama:** Do NOT use *"Milestone Narrative"*, *"Epic Chronicles"*, *"Anchored Evidence Vault"*. (Use *"Description"*, *"Summary"*, *"Business Impact"*, *"Linked Achievements"*).

#### 2. Canonical Entity Naming & Consistency:
Always maintain 100% terminology cohesion with the database schema, sidebar navigation, and existing routes:
* **"Achievements"** — Always use *"Achievements"* (NOT *"Milestones"* or *"Trophies"*). Route: `/achievements`, DB table: `achievements`.
* **"Journals" / "Entries"** — Always use *"Journals"* or *"Entries"* (NOT *"Logs"* or *"Traces"* as noun instances).
* **Page Titles:** Keep titles concise, single-noun, or clear standard actions (`Search`, `Journal`, `Achievements`, `Review`, `Dashboard`). Avoid bloated compound titles like *"Evidence Archive & Search"*.
* **Field Labels Across Views:** Section names in drawers and inspection views must align with form and detail pages:
  * `Work Completed` (what was delivered)
  * `Learnings & Insights` (what was learned)
  * `Blockers & Challenges` (roadblocks / friction)
  * `Next Steps` (next planned action)
  * `Business Impact` (quantified impact)
  * `Linked Achievements` / `Linked Journal Entries` (supporting relations)

---

## 4. Critical Technical Invariants & Gotchas

Any agent modifying code MUST adhere to these technical invariants:

### 1. Date & Timezone Safety:
* **NEVER** use `dateObj.toISOString().split('T')[0]` on a midnight local date object. In positive UTC offsets (e.g. UTC+7), `00:00` local converts to `17:00` previous day in UTC, causing subtle off-by-one day bugs.
* **ALWAYS** import and use `formatLocalDate()` from `frontend/src/lib/dateUtils.js`.

### 2. Form vs JSON API Contracts:
* **`POST /api/journals`**: Expects `multipart/form-data` because it accepts file attachments (even if no file is uploaded). Do NOT send JSON to this endpoint.
* **`POST /api/achievements`**: Expects `application/json`.
* **Authentication**: Cookie-based HTTP-only session via `/api/auth/login`. All client fetch calls MUST include `{ credentials: 'include' }`.

### 3. Backend Endpoint Standards & Verification:
* `GET /journals/:id` is fully registered and active in the Go backend (`internal/handler/routes.go`). Single-journal views fetch directly via this endpoint with session authentication and ownership validation.
* `kpi-periods` endpoints (`POST /api/kpi-periods`, `GET /api/kpi-periods`, `GET /api/kpi-periods/active`, `GET /api/kpi-periods/:id`) are fully implemented and active. Automatic period binding resolves organizational cycles based on `entry_date`.

### 4. Pure Vanilla CSS & Dropdown Rules:
* All styling is pure Vanilla CSS using custom properties defined in `index.css`. Do NOT add Tailwind CSS classes.
* Dropdowns (`select` tags): Must include `appearance: none`, `background-image: var(--select-arrow)`, `background-position: right 14px center`, and `padding-right: 38px` so chevron arrows do not crowd the rounded border.

### 5. Dual Theme Discipline:
* Every UI component or modification MUST be tested and verified in **BOTH Dark Mode and Light Mode** (`[data-theme="dark"]` and `[data-theme="light"]`). Never assume dark styles automatically look good in light mode.

### 6. React Portals for Overlays & The CSS Transform Trap:
* **The Containing Block Trap:** Under the CSS specification, any ancestor element with a CSS `transform` (e.g., page entrance animations like `.animate-in` or keyframe transforms) creates a new containing block for `position: fixed` descendants. This traps modal backdrops and slide-over drawers inside the scrolled ancestor, causing drawers to be clipped or offset off-screen (e.g. at negative Y-positions) when the page is scrolled down.
* **Invariant:** ALL modal overlays, slide-over drawers, and floating viewports MUST be rendered directly into `document.body` via React's `createPortal(jsx, document.body)`.
* **Body Scroll Lock:** Always set `document.body.style.overflow = 'hidden'` when an overlay is open and restore it cleanly on unmount or dismiss.

### 7. Theme Persistence Invariant (`wj_theme` vs `theme`):
* The localStorage key used by `ThemeContext.jsx` is `'wj_theme'`, **NOT** `'theme'`.
* Setting `'theme'` alone will not persist across reloads or page navigations and will fall back to `prefers-color-scheme`. Always use `localStorage.setItem('wj_theme', 'dark' | 'light')` and update `document.documentElement.setAttribute('data-theme', ...)` in sync.

### 8. Repository Batching & Zero N+1 Queries:
* When building search or list endpoints that return journals with tags or linked achievements (e.g. `/search/journals` and `/search/achievements`), **NEVER issue N+1 database queries per row**.
* Use batch queries (`GetJournalTagsByUser`, `GetAchievementJournalsByUser`) and perform the relation assembly in Go memory (`internal/repository/search.go`) before returning JSON.

---

## 5. Core Entities & Data Architecture

* **Journals:** Raw evidence capture (logs, what I did, what I learned, blockers, next plan, categories, tags, file attachments).
* **Achievements:** **First-class citizens.** Milestones with measurable business impact (`critical`, `high`, `medium`, `low`). Must always be prominently anchored and surfaced on timelines and calendars.
* **Invisible Work:** Essential contributions (mentorship, code reviews, incident response, tech debt refactoring, documentation). Must have dedicated categorization, analytics, and equal visibility to visible feature work.
* **KPI Periods:** Time-bounded organizational cycles (e.g., Q1 2026, Q2 2026) giving business context to contributions.
* **Teams & Users:** Roles (`employee`, `manager`, `admin`) and visibility levels (`private`, `team`, `manager_only`, `public`).

---

## 6. Test Credentials & Dev Environment

* **Frontend URL:** `http://localhost:3000` (Vite, React 19)
* **Backend URL:** `http://localhost:8080` (Go Gin REST API)
* **Default Seed Accounts:**
  * Employee: `kevin@test.com` / `password123`
  * Manager: `sarah@test.com` / `password123`

---

## 7. Dual-Engine Verification Protocol (Playwright + Chrome DevTools)

Agents must not rely on guesswork or static code reviews alone. The development lifecycle in TRACE leverages a complementary **Dual-Engine Protocol**:

```
+-------------------------------------------------------------------------------+
|                             AI AGENT WORKFLOW                                 |
+-------------------------------------------------------------------------------+
                                      |
                       [1. Implementation Complete]
                                      |
                                      v
         +---------------------------------------------------------+
         |     PHASE 1: THE DRIVER (Playwright MCP)                |
         |     Purpose: End-to-End User Simulation & Visual Flow   |
         |     * Authenticate & navigate routes                    |
         |     * Drive user journeys (clicks, inputs, modals)      |
         |     * Toggle Dual Themes (Dark vs Warm Parchment)       |
         |     * Capture screenshots to verify editorial aesthetic |
         +---------------------------------------------------------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
          [Flow Succeeded]                          [Issue Detected /
                 |                                  Audit Triggered]
                 v                                         |
         +---------------------------------------+         v
         |   PHASE 2: THE AUDITOR / FORENSICS    |  +------------------------------+
         |   (Chrome DevTools MCP)               |  | ESCALATION DIAGNOSTICS:      |
         |   Purpose: Deep Quality & Compliance  |  | * Network Initiator Trace    |
         |   * Lighthouse a11y & Contrast Audits |  | * React Console Error Stacks |
         |   * Performance Trace for heavy UI    |  | * Element Computed Styles    |
         |   * Heap Snapshots for Leaks          |  +------------------------------+
         +---------------------------------------+                 |
                 |                                                 v
                 +-------------------> [Autonomous Fix & Retest Loop]
```

### A. When to Use Playwright MCP (The Driver)
* **Primary Scope:** High-level browser actions, user journey traversal, and visual layout sanity.
* **Core Responsibilities:**
  1. **User Simulation:** Form submissions, dropdown selections, navigating through nested links, opening drawers and modals (`browser_click`, `browser_fill_form`, `browser_select_option`).
  2. **Dual-Theme Verification:** Dynamically toggling `document.documentElement.setAttribute('data-theme', 'light')` and capturing screenshots (`browser_take_screenshot`) to verify visual beauty, typography scaling, and border rendering in both dark obsidian and light parchment modes.
  3. **High-Level Assertion:** Verifying that DOM nodes exist and state changes reflect on the page (`browser_snapshot`).

### B. When to Escalate to Chrome DevTools MCP (The Forensic Auditor)
* **Primary Scope:** Low-level engine forensics, network payload root-causes, accessibility compliance, memory hygiene, and rendering performance.
* **Core Scenarios:**
  1. **Failure Diagnostics (Silent Bugs & 4xx/5xx APIs):**
     * When a click produces no response or an API fails, use `get_network_request` to view the full request/response body and the **exact JavaScript initiator stack trace** (the specific file and line in `src/api/...` that called it).
     * Use `list_console_messages` and `get_console_message` to retrieve unhandled promise rejections or React error boundaries.
  2. **Accessibility & Color Contrast Auditing (Crucial for Dual Themes):**
     * Visual screenshots alone cannot calculate mathematical contrast ratios.
     * Run `lighthouse_audit` or inspect computed styles to verify that secondary/muted text (`--text-muted`), tag badges, and calendar cells comply with WCAG AA (minimum 4.5:1 ratio) on both Dark obsidian (`#0d1117`) and Light parchment (`#fbf9f5`).
  3. **Performance & Jank Profiling (Heavy Components):**
     * For data-intensive UI components (e.g., the 365-cell Activity Calendar, lens mode recalculations, or dense journal filter search lists), use `performance_start_trace` and `performance_stop_trace` to detect **forced reflows / layout thrashing** or long tasks (>50ms).
  4. **Memory Hygiene & Detached DOM Check (Modals & Drawers):**
     * When building interactive overlays (like the Journal Entries Peek Drawer or AI Synthesis modals), verify clean unmounting.
     * Use `take_heapsnapshot` before and after opening/closing drawers repeatedly to ensure zero detached DOM trees or dangling event listeners.
  5. **Viewport & Bounding Box Forensics:**
     * Use `getBoundingClientRect()` via `browser_evaluate` to verify that modals/drawers render at `y: 0` and are not caught in an off-screen containing block trap caused by ancestor CSS animations.

### C. The Autonomous Fix & Retest Loop
1. **Never Stop at the First Error:** If a test fails or DevTools reports a violation, inspect the root cause immediately without waiting to be prompted.
2. **Apply Minimal, Surgical Edits:** Fix the underlying logic or CSS tokens cleanly.
3. **Re-run Verification:** Execute the Playwright simulation again to prove the fix works, and confirm DevTools logs are clean.

---

## 8. Strategic Roadmap & Feature Priorities

When designing new features or extending existing ones, align with these 4 strategic pillars:

1. **Supporting Evidence (Multi-Journal to Achievement Linking):**
   - Transform achievements from isolated entries into collections of supporting evidence (linking multiple daily journals, commits, and documents to 1 milestone).
2. **Invisible Work Quotient (Foundation Work Surface):**
   - Analytics and visual representation that surfaces non-feature contributions (maintenance, unblocking others, refactoring, documentation) so they count during reviews.
3. **Review Pack Generator (Performance Cycle Exporter):**
   - One-click generation of an executive performance appraisal summary (Markdown/PDF/Doc format) segmented by impact and KPI period, ready for 1-on-1s.
4. **AI-Assisted Synthesis (Review Summarizer):**
   - Summarizing raw journal logs into concise executive impact bullets, eliminating "recency bias" and saving hours of manual review prep.
