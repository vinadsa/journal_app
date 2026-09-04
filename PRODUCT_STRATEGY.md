# TRACE — Product Strategy & Architecture Roadmap

Dokumen ini adalah kompas strategis dan teknis pengembangan **TRACE (Work Journal & Career Evidence Archive)**. Dokumen ini berakar kuat pada misi utama aplikasi: **Menghancurkan Contribution Amnesia, Recency Bias, Invisible Work, dan Lack of Evidence**.

---

### Status Arsitektur & Peta Fitur (Update Terkini: September 2026)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            APLIKASI TRACE TERBARU                                │
│  Input Jurnal ──> Evidence Timeline / Kalender ──> Evidence Dossier ──> AI Draft │
│       │                                                    │                     │
│  [GET /:id] ✔                                      [Multi-Journal] ✔             │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                      GAP KRITIS BERIKUTNYA: "EXPORT & LEVERAGE"
                                         │
   ┌───────────────────────────┬─────────┴───────────────┬─────────────────────────┐
   │                           │                         │                         │
   ▼                           ▼                         ▼                         ▼
[1. REVIEW PACK EXPORT]    [2. KPI ALIGNMENT]     [3. INVISIBLE WORK]      [4. CAPTURE FRICTION]
Data masih terkurung di    kpi_periods belum      Metrik belum eksplisit   Masih 100% bergantung
web app; butuh PDF/MD      aktif penuh (501)      menilai "Shadow Work"    pada pengetikan manual
```

---

## 1. Status Fondasi Kritis (The Missing Essentials)

### A. The "Review Pack" & 1-on-1 Export Engine (Lack of Evidence Solution)
* **Status:** 🟡 **PRIORITAS UTAMA BERIKUTNYA (UP NEXT)**
* **Masalah Saat Ini:** Pengguna rajin mencatat jurnal, menandai pencapaian, dan men-generate AI Synthesis di `/review`. **Tetapi datanya masih terkurung di dalam web app.** Saat musim *performance appraisal* atau sesi 1-on-1 mingguan dengan manajer, pengguna harus menyalin teks satu per satu ke dokumen evaluasi perusahaan (Workday, Lattice, Google Docs, Slack).
* **Solusi Target:**
  * **Export to Executive Brief (PDF & Clean Markdown):** Satu tombol untuk menghasilkan dokumen resmi kuartalan berisi: Sintesis Eksekutif, Milestone Pencapaian dengan bukti Evidence Dossier, grafik distribusi kontribusi, dan link artefak.
  * **1-on-1 Talking Points Copier:** Tombol sekali klik di Dashboard untuk menyalin *bullet points* kemajuan minggu ini langsung ke *clipboard*, terformat rapi untuk Slack / 1-on-1 notes.

---

### B. Hubungan "Piramida Bukti" (Multi-Journal to One Achievement)
* **Status:** 🟢 **COMPLETED (SHIPPED - Sesi Ini)**
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
* **Status:** 🟡 **NEXT SPRINT**
* **Masalah Saat Ini:** Tabel `kpi_periods` sudah ada di database, namun di [routes.go](file:///Users/kevin/Develop/Projects/journal_app/internal/handler/routes.go) rutenya masih mengembalikan `501 Not Implemented`. Entri jurnal saat ini melayang tanpa konteks target bisnis kuartal tim.
* **Solusi Target:** Hubungkan entri dan achievement dengan *Objective/KPI Period*. Seorang profesional tidak hanya dinilai dari *"apa yang kamu kerjakan"*, tapi *"apakah yang kamu kerjakan selaras dengan target kuartal perusahaan"*.

---

### D. Perbaikan Infrastruktur Data: Endpoint `GET /journals/:id`
* **Status:** 🟢 **COMPLETED (SHIPPED - Sesi Ini)**
* **Implementasi Arsitektur:**
  * Endpoint `GET /journals/:id` terealisasi penuh di Go backend (repository, service, handler, routes) dengan validasi otentikasi sesi dan pengecekan kepemilikan user (status 404 jika tidak ditemukan).
  * Menghapus *architectural debt* di mana frontend terpaksa memanggil `searchJournals({ limit: 100 })` lalu memfilter di memori klien.
  * [JournalDetailPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/JournalDetailPage.jsx) dan [JournalFormPage.jsx](file:///Users/kevin/Develop/Projects/journal_app/frontend/src/pages/JournalFormPage.jsx) kini memuat data entri secara instan tanpa limitasi urutan.
  * Navigasi rail kronologis (*Previous / Next Entry*) tetap dipertahankan secara asinkron tanpa memblokir rendering utama.

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

1. **Efisiensi Kueri sqlc Tanpa N+1:**
   * Penggunaan kueri `GetAchievementJournalsByUser` yang menggabungkan `achievement_journals`, `achievements`, dan `journals` dalam satu kueri memungkinkan backend mengembalikan seluruh daftar achievement beserta berkas bukti (*Evidence Dossier*) tanpa loop kueri terpisah (*zero N+1 penalty*).
2. **Keamanan Zona Waktu (Local Date Safety):**
   * Peringatan `AGENTS.md` terbukti krusial: penggunaan `new Date().toISOString().split('T')[0]` menghasilkan off-by-one day pada zona waktu Asia/Jakarta (+07:00). Standardisasi wajib menggunakan `formatLocalDate()` pada seluruh komponen frontend.
3. **Dual-Engine Protocol:**
   * Pengujian end-to-end menggunakan Playwright MCP yang dipadukan dengan inspeksi konsol browser membuktikan bahwa tampilan *Evidence Dossier* tampil harmonis pada kedua tema (**Dark Obsidian** dan **Warm Linen / Parchment**) dengan kontras teks dan badge yang terbaca jelas.

---

## 4. Rekomendasi Prioritas Eksekusi (Roadmap Terkini)

```
[SELESAI]  Sprint Fondasi Data:
           ✔ Endpoint GET /journals/:id
           ✔ Many-to-Many Evidence Dossier (achievement_journals)

[SEKARANG] Sprint Review Pack Engine:
           ► Ekspor Executive Brief (PDF & Clean Markdown) di /review
           ► 1-on-1 Standup / Talking Points Quick Copier

[BERIKUT]  Sprint Goal Alignment & Shadow Work:
           ► Aktivasi penuh kpi_periods & goal alignment
           ► Invisible Work Quotient & Unsung Hero analytics

[MENDATANG] Sprint AI Career Advocate:
           ► AI Promotion Dossier Builder (mapping ke rubrik engineering level)
           ► Smart Ingestion (CLI & Git Webhooks)
```