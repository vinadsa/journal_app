# Journal App — API Testing Guide

## Setup

Sebelum testing, pastikan database sudah di-seed:

```bash
make freshdb        # drop → create → migrate → seed
# atau jika DB sudah ada:
make migrate && make seed
```

Kemudian jalankan server:

```bash
go run cmd/server/main.go
```

Server berjalan di `http://localhost:8001`

---

## Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Kevin | kevin@test.com | password123 | employee |
| Sarah | sarah@test.com | password123 | manager |

---

## Seeded Data Summary

| Entity | Count | Details |
|--------|-------|---------|
| Teams | 2 | Engineering Team, Product Team |
| Users | 2 | Kevin (employee), Sarah (manager) |
| Journals | 6 | Dates: May 26-31, 2026 |
| Tags | 7 | backend, infrastructure, database, security, performance, devops, incident |
| Journal-Tags | 12 | Various mappings |
| Achievements | 4 | Linked to journals 2, 3, 5, 6 |

---

## 1. Health Check

```bash
curl -s http://localhost:8001/health
```

---

## 2. Auth — Login

Login sebagai Kevin untuk mendapatkan session cookie:

```bash
curl -s -X POST http://localhost:8001/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "kevin@test.com",
    "password": "password123"
  }'
```

> **Penting**: Semua request berikutnya menggunakan `-b cookies.txt` untuk mengirim session cookie.

---

## 3. Auth — Register (User Baru)

```bash
curl -s -X POST http://localhost:8001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi",
    "email": "budi@test.com",
    "password": "password123",
    "team_id": 1
  }'
```

---

## 4. Auth — Logout

```bash
curl -s -X POST http://localhost:8001/logout \
  -b cookies.txt
```

> Setelah logout, login ulang untuk melanjutkan test.

---

## 5. Teams — Create Team

```bash
curl -s -X POST http://localhost:8001/teams \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "QA Team"
  }'
```

---

## 6. Journals — Create Journal

```bash
curl -s -X POST http://localhost:8001/journals \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "API Testing Day",
    "did_today": "Tested all Phase 1 endpoints using curl and Apidog.",
    "learned_today": "Learned about cookie-based auth testing.",
    "category": "development",
    "blockers": "",
    "next_plan": "Document test results and report bugs."
  }'
```

---

## 7. Tags — Create Tag

```bash
curl -s -X POST http://localhost:8001/tags \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "testing"
  }'
```

---

## 8. Tags — List All Tags

```bash
curl -s http://localhost:8001/tags \
  -b cookies.txt
```

---

## 9. Tags — Delete Tag

```bash
curl -s -X DELETE http://localhost:8001/tags/8 \
  -b cookies.txt
```

> Ganti `8` dengan ID tag yang ingin dihapus.

---

## 10. Journal Tags — Add Tag to Journal

Menambahkan tag "backend" (id=1) ke journal id=1:

```bash
curl -s -X POST http://localhost:8001/journals/1/tags \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "tag_id": 1
  }'
```

---

## 11. Journal Tags — Get Tags for a Journal

```bash
curl -s http://localhost:8001/journals/1/tags \
  -b cookies.txt
```

---

## 12. Journal Tags — Remove Tag from Journal

Menghapus tag id=6 (devops) dari journal id=1:

```bash
curl -s -X DELETE http://localhost:8001/journals/1/tags/6 \
  -b cookies.txt
```

---

## 13. Achievements — Create Achievement

```bash
curl -s -X POST http://localhost:8001/achievements \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "journal_id": 1,
    "title": "Set up complete CI/CD pipeline",
    "description": "Configured end-to-end CI/CD with GitHub Actions, automated testing, and staging deployment.",
    "impact": "Reduced deployment time from 2 hours to 15 minutes.",
    "importance": "high",
    "achieved_date": "2026-05-26"
  }'
```

---

## 14. Achievements — List All User Achievements (Paginated)

```bash
curl -s "http://localhost:8001/achievements?limit=10&offset=0" \
  -b cookies.txt
```

---

## 15. Achievements — Get Single Achievement

```bash
curl -s http://localhost:8001/achievements/1 \
  -b cookies.txt
```

---

## 16. Achievements — Get Achievements by Journal

```bash
curl -s http://localhost:8001/journals/2/achievements \
  -b cookies.txt
```

---

## 17. Achievements — Update Achievement

```bash
curl -s -X PUT http://localhost:8001/achievements/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Successfully migrated production database to PostgreSQL 16 with zero downtime",
    "impact": "Reduced deployment downtime by 80%, improved query performance by 30%, and enabled new features."
  }'
```

---

## 18. Achievements — Delete Achievement

```bash
curl -s -X DELETE http://localhost:8001/achievements/5 \
  -b cookies.txt
```

> Ganti `5` dengan ID achievement yang baru dibuat di step 13.

---

## 19. Search — By Keyword

```bash
curl -s "http://localhost:8001/search/journals?keyword=migration" \
  -b cookies.txt
```

---

## 20. Search — By Category

```bash
curl -s "http://localhost:8001/search/journals?category=development" \
  -b cookies.txt
```

---

## 21. Search — By Tag

```bash
curl -s "http://localhost:8001/search/journals?tag=security" \
  -b cookies.txt
```

---

## 22. Search — By Date Range

```bash
curl -s "http://localhost:8001/search/journals?date_from=2026-05-28&date_to=2026-05-31" \
  -b cookies.txt
```

---

## 23. Search — Combined Filters

```bash
curl -s "http://localhost:8001/search/journals?keyword=query&category=maintenance&tag=database&limit=5&offset=0" \
  -b cookies.txt
```

---

## 24. Search — Empty Keyword (All Journals)

```bash
curl -s "http://localhost:8001/search/journals?limit=20&offset=0" \
  -b cookies.txt
```

---

## Testing Tips untuk Apidog

1. **Import curl**: Di Apidog, klik "Import" → "cURL" → paste curl command
2. **Cookie management**: Setelah login, copy `session_token` dari response `Set-Cookie` header dan set sebagai Cookie di Apidog environment
3. **Base URL**: Set `http://localhost:8001` sebagai base URL di environment
4. **Untuk Apidog tanpa cookie file**: Ganti `-b cookies.txt` dengan header manual:
   ```bash
   -H "Cookie: session_token=YOUR_TOKEN_HERE"
   ```

### Quick Login → Get Token (untuk Apidog)

Jika Apidog tidak support cookie file, login dulu dan lihat response header:

```bash
curl -v -X POST http://localhost:8001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kevin@test.com",
    "password": "password123"
  }' 2>&1 | grep Set-Cookie
```

Kemudian gunakan token dari output `Set-Cookie: session_token=XXX` untuk semua request berikutnya:

```bash
curl -s http://localhost:8001/tags \
  -H "Cookie: session_token=XXX"
```
