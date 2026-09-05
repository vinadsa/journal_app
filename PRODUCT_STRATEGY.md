# TRACE — Product Strategy & Architecture Roadmap

Dokumen ini adalah kompas strategis dan teknis pengembangan **TRACE (Work Journal & Career Evidence Archive)**. Dokumen ini berakar kuat pada misi utama aplikasi: **Menghancurkan Contribution Amnesia, Recency Bias, Invisible Work, dan Lack of Evidence**.

---
### Status Arsitektur & Peta Fitur (Update Terkini: September 2026)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        APLIKASI TRACE TERBARU                                          │
│  Input Jurnal ──> Evidence Timeline ──> Evidence Dossier ──> AI Draft ──> Review Pack (PDF & MD) ✔   │
│       │                      │                 │                                 │                     │
│  [GET /:id] ✔         [KPI Cycles] ✔    [Multi-Journal] ✔                 [1-on-1 Copier] ✔            │
└──────────────────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                                   │
                                FOKUS STRATEGIS UTAMA: "SURFACE & REWARD"
                                                   │
                                                   ▼
                                      [INVISIBLE WORK QUOTIENT]
                         Fondasi data & tag shadow work aktif (seed 28 entri) ✔;
                         Kini butuh visual analytics & Unsung Hero metrics surface!
```

---

## 1. Status Fondasi Kritis (The Missing Essentials)

### A. The "Review Pack" & 1-on-1 Export Engine (Lack of Evidence Solution)
* **Status:** 🟢 **COMPLETED (SHIPPED - Sesi Ini)**
* **Implementasi Arsitektur:**
  * **Modul `reviewPackUtils.js`:** Mesin kompilasi Markdown dan talking points terstruktur dengan proteksi clipboard fallback dan penanganan download berkas `.md`.
  * **Komponen `ReviewPackModal.jsx`:** Modal ekspor editorial di `/review` dengan live preview dokumen bertema TRACE, toggle granular per seksi, tombol download `.md`, salin Markdown untuk Lattice/Notion/Docs, dan ekspor cetak PDF.
  * **Mesin Cetak `@media print` di `ReviewPack.css`:** Format cetak standar eksekutif (A4 portrait) yang mengisolasi lembar dokumen, menyembunyikan navigasi web, dan mencegah pemotongan kartu (*page-break-inside: avoid*).
  * **Komponen `TalkingPointsModal.jsx`:** Tombol cepat di Dashboard untuk menyalin *talking points* 1-on-1 (7, 14, 30 hari) berformat Slack Markdown.

---

### B. Hubungan "Piramida Bukti" (Multi-Journal to One Achievement)
* **Status:** 🟢 **COMPLETED (SHIPPED)**
* **Implementasi Arsitektur:**
  * **Tabel Junction `achievement_journals`:** Menghubungkan relasi *many-to-many* antara `achievements` dan `journals`.
  * **Backward Compatibility:** Kolom `achievements.journal_id` diubah menjadi `NULLABLE` (`ON DELETE SET NULL`), dan seluruh data lama dimigrasikan secara otomatis tanpa *data loss*.
  * **Dossier Endpoints:**
    * `GET /achievements/:id/journals` — Mengambil seluruh entri jurnal pendukung sebuah milestone.
    * `POST /achievements/:id/journals` — Menautkan entri jurnal baru sebagai bukti pencapaian.
    * `DELETE /achievements/:id/journals/:journalId` — Memutus relasi bukti secara aman.
  * **Evidence Dossier UI:** Di halaman [AchievementsPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/AchievementsPage.jsx), setiap kartu milestone kini menampilkan badge **Evidence Dossier** dengan pil tanggal dan judul entri yang dapat diklik langsung ke catatan detail.

---

### C. KPI Periods & Goal Alignment yang Sebenarnya
* **Status:** 🟢 **COMPLETED (SHIPPED - Sesi Ini)**
* **Implementasi Arsitektur:**
  * **Aktivasi Penuh Backend (Go REST API):** Menggantikan stub `501 Not Implemented` dengan implementasi penuh pada `POST /api/kpi-periods`, `GET /api/kpi-periods`, `GET /api/kpi-periods/active`, dan `GET /api/kpi-periods/:id`.
  * **Intelligent Auto-Period Binding:** Pada pembuatan jurnal (`POST /api/journals`), backend secara otomatis mencocokkan tanggal entri (`entry_date`) ke rentang `start_date` – `end_date` siklus KPI aktif tim, dengan fallback ke siklus KPI aktif saat ini.
  * **Database & Query Layer:** Penambahan query type-safe `GetKPIsByUser` dan `GetKPIByDateAndUser` di `sql/query.sql` via sqlc, serta pembaruan data benih `sql/seed.sql` dengan `Q3 2026` (aktif) dan `Q2 2026`.
  * **Activity Calendar & Review Integration:**
    * Komponen `ActivityCalendar.jsx` kini menerima prop `kpiPeriod` dan menampilkan pil siklus (`Cycle: Q3 2026`) serta lencana `KPI Linked` di dalam laci peninjau bukti (*Evidence Peek Drawer*).
    * Halaman [ReviewPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/ReviewPage.jsx) memuat siklus KPI aktual dari backend, mengunci rentang waktu kalender secara dinamis ke batas tanggal kuartal, dan meneruskan label periode resmi ke modal ekspor.
    * Halaman [DashboardPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/DashboardPage.jsx) menampilkan banner interaktif *Target Cycle* yang langsung menautkan ke ulasan kuartal aktif.
    * Halaman [JournalDetailPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/JournalDetailPage.jsx) dan [JournalFormPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/JournalFormPage.jsx) menampilkan indikator siklus target secara dinamis saat tanggal entri dipilih.

---

### D. Perbaikan Infrastruktur Data: Endpoint `GET /journals/:id`
* **Status:** 🟢 **COMPLETED (SHIPPED)**
* **Implementasi Arsitektur:**
  * Endpoint `GET /journals/:id` terealisasi penuh di Go backend (repository, service, handler, routes) dengan validasi otentikasi sesi dan pengecekan kepemilikan user (status 404 jika tidak ditemukan).
  * Menghapus *architectural debt* di mana frontend terpaksa memanggil `searchJournals({ limit: 100 })` lalu memfilter di memori klien.
  * [JournalDetailPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/JournalDetailPage.jsx) dan [JournalFormPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/JournalFormPage.jsx) kini memuat data entri secara instan tanpa limitasi urutan.
  * Navigasi rail kronologis (*Previous / Next Entry*) tetap dipertahankan secara asinkron tanpa memblokir rendering utama.

---

### E. Perluasan Fondasi Data Seeder (Real-World Evidence & Shadow Work Dataset)
* **Status:** 🟢 **COMPLETED (SHIPPED - Sesi Ini)**
* **Implementasi Arsitektur & Dataset:**
  * **28 Entri Realistis untuk Kevin (`kevin@test.com`, Senior IC):** Tersebar di Q2 2026 (10 entri) dan Q3 2026 (18 entri), mencakup spektrum pekerjaan fitur (*Payment Gateway, OAuth2 PKCE*) dan *shadow work* (*mentoring Go concurrency & deadlock debugging, Redis incident response, post-mortem writeup, runbook authoring, N+1 query elimination, legacy API deprecation*).
  * **Variasi Intensitas Harian untuk Activity Calendar:** Disusun secara strategis agar kalender kontribusi merender seluruh tingkat intensitas (*level-1* s/d *level-4* / peak incident day pada 26 Agustus 2026).
  * **11 Tag Tematik Lengkap:** `#backend`, `#infrastructure`, `#database`, `#security`, `#performance`, `#devops`, `#incident`, `#mentoring`, `#refactor`, `#tech-debt`, `#architecture`.
  * **9 Achievements Berbobot & Evidence Dossier:** Seluruh pencapaian (4 di Q2 dan 5 di Q3) didukung oleh 2–4 entri jurnal pendukung (*Piramida Bukti*) di tabel `achievement_journals`.
  * **6 Entri Manajerial untuk Sarah (`sarah@test.com`, Manager):** Mencakup kalibrasi hiring, 1-on-1 performance review, negosiasi alokasi roadmap tech debt 25%, dan retrospektif sprint.
  * **Makefile Resilience:** Penambahan opsi `--force --if-exists` pada target `dropdb` agar `make freshdb` selalu berhasil dieksekusi tanpa terblokir koneksi aktif backend.

---

## 2. High-Impact Differentiators (Keunggulan Kompetitif Utama)

Fitur-fitur pembeda yang menjadikan TRACE sebagai **Senjata Rahasia Karier (*Career Weapon*)**:

### A. "Invisible Work" Quotient & Impact Surface
* **Mengapa Krusial:** Profesional sering mengalami *burnout* akibat pekerjaan esensial di balik layar (mentoring, incident triage, review PR rekan, refactoring arsitektur). Di akhir kuartal, mereka dinilai lambat karena pekerjaan ini tidak terlihat di Jira.
* **Kalkulasi & Metrik Kuantitatif:**
  * **Invisible Work Quotient (IWQ):**
    $$\text{IWQ} = \left( \frac{\text{Entri Shadow Work}}{\text{Total Entri Siklus}} \right) \times 100\%$$
    * *Shadow Work Traces:* Entri dengan tag `#mentoring`, `#refactor`, `#tech-debt`, `#incident`, `#architecture`, atau kategori `maintenance`, `meeting`, dan `other`.
    * *Visible Feature Traces:* Entri pengembangan langsung berorientasi deliverable (kategori `development` dengan tag `#backend`, `#infrastructure`, `#database`, `#security`).
  * **The 4 Pillar Breakdown:**
    1. **System Stewardship & Tech Debt:** Refactoring, migrasi arsitektur, optimasi query, deprecation.
    2. **Operational Resilience & Triage:** Incident response P1/P2, post-mortem blameless, hotfix darurat, alert runbooks.
    3. **People & Team Multiplier:** Mentoring junior/mid engineer, unblocking peers, concurrency training, PR reviews.
    4. **Governance & Architecture:** Security compliance audit, ADR authoring, RFC discussions.
* **Fitur & Komponen Rencana UI:**
  * **Unsung Hero Quotient Card** di `/dashboard` dan `/review`: Donut chart & progress meter editorial yang membandingkan *Visible Features vs Invisible Foundation Work*.
  * **The "Unsung Hero" Narrative:** Insight otomatis berbasis template editorial: *"Di Q3 2026, 55% kontribusi Anda adalah Invisible Work (1 insiden kritis diatasi, 3 sesi mentoring, 24 query N+1 diselesaikan). Stabilitas sistem terjaga 99.98% berkat pekerjaan fondasi ini."*
  * **Review Pack Integration:** Bagian khusus *"Essential Foundation & Shadow Work Contributions"* di modal ekspor Review Pack (PDF/Markdown) yang siap dibawa ke 1-on-1 bersama manajer.

### B. Smart Ingestion / Low-Friction Quick Capture
* **Mengapa Krusial:** Alasan utama orang terkena *Contribution Amnesia* adalah **lupa atau terlalu lelah untuk mencatat manual**.
* **Fitur Terencana:**
  * **Webhook / Git Integration (Draft Traces):** Menarik otomatis judul commit atau PR yang di-merge sebagai *draft* harian. Di sore hari, user cukup menekan *"Approve as evidence"*.
  * **CLI Quick Log:** Mengetik `trace "fixed memory leak in auth worker"` langsung dari terminal tanpa membuka browser.

### C. Promotion & Level-Up Dossier Builder (AI Career Advocate)
* **Fitur Terencana:** Mode AI khusus di mana pengguna memasukkan kriteria level karier perusahaan (misal: Mid $\rightarrow$ Senior $\rightarrow$ Staff), lalu sistem secara otomatis mengelompokkan jurnal dan pencapaian selama 1 tahun ke dalam rubrik tersebut.

### D. Team Calibration View (Untuk Manajer)
* **Fitur Terencana:** Akses khusus bagi manajer untuk melihat *Activity Timeline* seluruh anggota tim secara objektif sebelum rapat penilaian akhir tahun, sehingga menghapus **Recency Bias** di level kepemimpinan.

---

## 3. Catatan Pembelajaran Teknis & Engineering Insights (Sesi Ini)

1. **Zero-Dependency Native Print Engine vs Heavy PDF Binaries:**
   * Alih-alih menambahkan pustaka biner PDF berat (seperti jsPDF, pdfmake, atau html2canvas) yang menambah ratusan kilobyte pada bundel klien dan sering mengorbankan kualitas rendering font Newsreader serif, TRACE memanfaatkan native browser `window.print()` yang dipandu aturan `@media print` CSS modern.
   * Format cetak A4 portrait (`@page { size: A4 portrait; margin: 14mm; }`) dengan `break-inside: avoid` pada setiap kartu pencapaian dan tabel spektrum kontribusi menjamin laporan tidak terpotong canggung di antara pergantian halaman.
   * **Trik Penamaan Berkas Otomatis:** Memperbarui `document.title` sesaat sebelum eksekusi `window.print()` memungkinkan dialog cetak sistem operasi secara otomatis menyarankan nama berkas PDF yang rapi (`TRACE_Review_Pack_[Period]_[User].pdf`) tanpa kode backend tambahan.

2. **Arsitektur Resilient Clipboard Fallback:**
   * API modern `navigator.clipboard.writeText()` mensyaratkan dokumen dalam kondisi terfokus (*document focus*) dan berjalan di *secure context* (HTTPS / localhost). Dalam beberapa konteks peramban atau lingkungan otomatisasi, API ini dapat melempar `NotAllowedError`.
   * Implementasi fungsi fallback dengan elemen `<textarea>` transien (`document.execCommand('copy')`) menjamin tombol "Copy Markdown" dan "Copy Talking Points" berfungsi 100% tanpa kegagalan di seluruh skenario.

3. **Disiplin Dual Theme pada Lembar Dokumen Editorial:**
   * Melalui verifikasi *Playwright MCP*, lembar preview dokumen di `/review` diuji secara ketat pada kedua mode: **Dark Obsidian** (latar kanvas slate dalam dengan teks kontras tinggi) dan **Warm Parchment/Linen** (latar kertas arsip hangat dengan tipografi Newsreader serif).
   * Pada saat dokumen dicetak (`@media print`), tema visual web otomatis dinetralkan menjadi monokrom/tinta gelap berlatar putih murni (*ink-efficient print layout*) guna mencegah pemborosan tinta printer dan menjaga kejelasan dokumen resmi.

4. **Kepatuhan React 19 State Synchronization:**
   * Aturan baru React 19 (`react-hooks/set-state-in-effect`) melarang sinkronisasi state lokal di dalam `useEffect` yang dapat menyebabkan *cascading re-renders*.
   * Menggunakan pola *derived state with local override* (`includeSynthesisOverride !== null ? includeSynthesisOverride : Boolean(aiSynthesis)`) menyelesaikan kebutuhan reaktivitas data secara bersih dan mempertahankan performa render instan.

5. **Ketahanan Database Reset (`--if-exists --force` pada Makefile):**
   * Postgres `dropdb` standar akan menolak menghapus database jika terdapat sesi aktif dari pool koneksi Go backend (`pgxpool`) (`ERROR: database is being accessed by other users`).
   * Menambahkan parameter `--if-exists --force` pada target `dropdb` di `Makefile` memastikan sesi aktif langsung diputus secara aman sebelum database dibuat ulang, menjamin perintah `make freshdb` selalu bekerja dalam sekali jalan tanpa intervensi manual.

6. **Relational Seeding Deterministik via SQL Subquery Selects:**
   * Menghindari penggunaan ID numerik statis (`id = 1, 2...`) pada junction table (`journal_tags` dan `achievement_journals`) dengan memanfaatkan sintaks deklaratif: `SELECT j.id, t.id FROM journals j, tags t WHERE j.title = '...' AND t.name = '...'`. Pola ini menjamin relasi foreign key tetap valid 100% meskipun urutan baris atau nilai sequence identity mengalami pergeseran.

---

## 4. Rekomendasi Prioritas Eksekusi (Roadmap Terkini)

```
[SELESAI]  Sprint Fondasi Data:
           ✔ Endpoint GET /journals/:id
           ✔ Many-to-Many Evidence Dossier (achievement_journals)

[SELESAI]  Sprint Review Pack Engine:
           ✔ Ekspor Executive Brief (PDF & Clean Markdown) di /review
           ✔ 1-on-1 Standup / Talking Points Quick Copier di Dashboard

[SELESAI]  Sprint Goal Alignment (KPI Periods):
           ✔ Aktivasi penuh kpi_periods (migrasi 501 -> Go service & REST endpoints aktif)
           ✔ Automatic journal entry & achievement period binding berdasarkan tanggal
           ✔ Activity Calendar & Evidence Timeline KPI integration di Dashboard & Review
           ✔ Target Cycle indicator di Journal Detail, Form, dan Executive Review Pack
           ✔ UI Polish: Single-line Review Toolbar & Editorial AI Synthesis Loading Card

[SELESAI]  Sprint Fondasi Data Seeder & Shadow Work Evidence:
           ✔ Ekspansi komprehensif sql/seed.sql (28 entri Kevin & 6 entri Sarah di Q2 & Q3 2026)
           ✔ Multi-Journal Achievement Dossiers untuk 9 milestone (Piramida Bukti)
           ✔ 11 tag tematik shadow work (#mentoring, #refactor, #incident, #architecture, #tech-debt, etc.)
           ✔ Fresh database migration & seeding (make freshdb / make seed)
           ✔ Dual-engine Playwright verification (Dark Obsidian & Warm Parchment)

[SEKARANG] Sprint Shadow Work & Invisible Work Quotient:
           ► Invisible Work Quotient & Unsung Hero visual analytics
           ► Categorization breakdown untuk mentoring, refactoring, tech debt, dan incident response
           ► Perbandingan Visible (Feature) vs Invisible Work di Dashboard & Review

[MENDATANG] Sprint AI Career Advocate:
           ► AI Promotion Dossier Builder (mapping ke rubrik engineering level)
           ► Smart Ingestion (CLI & Git Webhooks)
```