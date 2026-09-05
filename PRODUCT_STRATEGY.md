# TRACE — Product Strategy & Architecture Roadmap

Dokumen ini adalah kompas strategis dan teknis pengembangan **TRACE (Work Journal & Career Evidence Archive)**. Dokumen ini berakar kuat pada misi utama aplikasi: **Menghancurkan Contribution Amnesia, Recency Bias, Invisible Work, dan Lack of Evidence**.

---
### Status Arsitektur & Peta Fitur (Update Terkini: September 2026)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        APLIKASI TRACE TERBARU                                          │
│  Input Jurnal ──> Evidence Timeline ──> Evidence Dossier ──> AI Draft ──> Review Pack (PDF & MD) ✔   │
│       │                                      │                                 │                   │
│  [GET /:id] ✔                        [Multi-Journal] ✔                  [1-on-1 Copier] ✔          │
└──────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                   │
                               GAP STRATEGIS BERIKUTNYA: "ALIGN & SURFACE"
                                                   │
                    ┌──────────────────────────────┴──────────────────────────────┐
                    ▼                                                             ▼
         [1. KPI & GOAL ALIGNMENT]                                     [2. INVISIBLE WORK QUOTIENT]
         kpi_periods belum aktif (501);                                Metrik & kalkulasi shadow work
         entri butuh koneksi ke target tim                             butuh visualisasi terdedikasi
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
* **Status:** 🟡 **PRIORITAS UTAMA BERIKUTNYA (UP NEXT)**
* **Kebutuhan Bisnis & Pengujian:**
  * Saat ini `sql/seed.sql` hanya memiliki 6 entri di bulan Mei 2026 (Q2). Kuartal aktif saat ini (**Q3 2026**) memiliki 0 entri di database benih asli. Jika `make freshdb` dijalankan, kuartal aktif akan kosong.
  * Sebelum membangun analitik *Invisible Work Quotient*, kita membutuhkan dataset seeder yang kaya dan representatif (~20–25 entri) yang mencakup pekerjaan di balik layar (*mentoring*, *tech debt clearance*, *refactoring*, *incident response*, *documentation*) serta *evidence dossiers* yang menghubungkan multi-jurnal ke milestone pencapaian.
* **Cakupan Rencana:**
  * Menambahkan 20–25 entri jurnal realistis untuk Kevin (Senior IC) yang tersebar di Q2 & Q3 2026.
  * Menambahkan entri manajemen & kalibrasi tim untuk Sarah (`sarah@test.com`, Manager).
  * Menyematkan tag tematik: `#mentoring`, `#refactor`, `#incident`, `#security`, `#architecture`, `#tech-debt`, `#performance`.
  * Menautkan multi-jurnal ke tabel `achievement_journals` untuk membentuk berkas bukti (*Piramida Bukti*) yang konkret.

---

## 2. High-Impact Differentiators (Keunggulan Kompetitif Utama)

Fitur-fitur pembeda yang menjadikan TRACE sebagai **Senjata Rahasia Karier (*Career Weapon*)**:

### A. "Invisible Work" Quotient & Impact Surface
* **Mengapa Krusial:** Profesional sering mengalami *burnout* akibat pekerjaan esensial di balik layar (mentoring, incident triage, review PR rekan, refactoring arsitektur). Di akhir kuartal, mereka dinilai lambat karena pekerjaan ini tidak terlihat di Jira.
* **Fitur Terencana:**
  * **Shadow Work Detector:** Menghitung rasio kontribusi antara *Direct Feature Work* vs *Operational/Support/Mentoring Work*.
  * **The "Unsung Hero" Summary:** Insight otomatis: *"Sepanjang Q3, Anda menangani 38 insiden pemeliharaan dan 14 sesi mentoring. Tanpa kontribusi ini, stabilitas tim berisiko turun signifikan."*

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

[SEKARANG] Sprint Fondasi Data Seeder & Shadow Work Evidence:
           ► Ekspansi komprehensif sql/seed.sql (20–25 entri Q2 & Q3 2026 dengan tagging shadow work)
           ► Multi-Journal Achievement Dossiers untuk milestone Q3
           ► Mock leadership logs untuk akun Manager (sarah@test.com)
           ► Fresh database migration & seeding (make freshdb)

[MENDATANG] Sprint Shadow Work & Invisible Work Quotient:
           ► Invisible Work Quotient & Unsung Hero visual analytics
           ► Categorization breakdown untuk mentoring, refactoring, tech debt, dan incident response
           ► Perbandingan Visible (Feature) vs Invisible Work di Dashboard & Review

[MENDATANG] Sprint AI Career Advocate:
           ► AI Promotion Dossier Builder (mapping ke rubrik engineering level)
           ► Smart Ingestion (CLI & Git Webhooks)
```