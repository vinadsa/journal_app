# Database Seeder Data

This document outlines the initial data populated in the database when running `make seed`.

## 🏢 Teams
| ID | Name | Manager |
|---|---|---|
| 1 | Engineering Team | Sarah Manager (ID: 2) |
| 2 | Product Team | (None) |

## 👥 Users
**Note:** All users share the default password `password123`.

| ID | Name | Email | Role | Team |
|---|---|---|---|---|
| 1 | Kevin | `kevin@test.com` | employee | Engineering Team |
| 2 | Sarah Manager | `sarah@test.com` | manager | Engineering Team |

## 📅 KPI Periods
| ID | Name | Start Date | End Date | Team |
|---|---|---|---|---|
| 1 | Q2 2026 | 2026-04-01 | 2026-06-30 | Engineering Team |

## 🏷️ Tags
1. `backend`
2. `infrastructure`
3. `database`
4. `security`
5. `performance`
6. `devops`
7. `incident`

---

## 📓 Journals (User: Kevin, KPI Period: Q2 2026)

### 1. Setup CI/CD Pipeline
- **Date:** 2026-05-16
- **Category:** `development`
- **Visibility:** `team`
- **Tags:** `infrastructure`, `devops`
- **Did Today:** Configured GitHub Actions for automated testing and deployment. Set up staging environment.
- **Learned Today:** Learned about GitHub Actions matrix strategy for multi-version testing.
- **Blockers:** Docker registry access needed from infra team.
- **Next Plan:** Complete deployment to staging.

### 2. Production Database Migration
- **Date:** 2026-05-17
- **Category:** `maintenance`
- **Visibility:** `team`
- **Tags:** `database`, `infrastructure`
- **Did Today:** Executed the planned migration from PostgreSQL 14 to 16. Ran full data integrity checks post-migration.
- **Learned Today:** Learned about pg_upgrade in-place strategy and logical replication fallback.
- **Next Plan:** Monitor performance metrics for 48 hours.
- **🏆 Achievement Linked:** Yes

### 3. Authentication API Refactor
- **Date:** 2026-05-18
- **Category:** `development`
- **Visibility:** `private`
- **Tags:** `backend`, `security`
- **Did Today:** Refactored the authentication module to use JWT with refresh tokens. Added rate limiting on login endpoint.
- **Learned Today:** Deep dive into bcrypt cost factors and their impact on response time.
- **Blockers:** Need security team review before merge.
- **Next Plan:** Write integration tests for auth flow.
- **🏆 Achievement Linked:** Yes

### 4. Sprint Planning & Architecture Review
- **Date:** 2026-05-19
- **Category:** `meeting`
- **Visibility:** `team`
- **Tags:** `backend`
- **Did Today:** Led sprint planning for Sprint 14. Presented architecture proposal for the notification service.
- **Learned Today:** Learned about event-driven architecture patterns with NATS.
- **Next Plan:** Draft ADR for notification service.

### 5. Security Incident Response
- **Date:** 2026-05-20
- **Category:** `other`
- **Visibility:** `manager_only`
- **Tags:** `security`, `incident`
- **Did Today:** Investigated and resolved unauthorized access attempt on the staging API. Patched the vulnerability and updated firewall rules.
- **Learned Today:** Learned about OWASP API Security Top 10 and rate-limiting best practices.
- **Blockers:** Need to update all API keys after incident.
- **Next Plan:** Write incident retrospective report.
- **🏆 Achievement Linked:** Yes

### 6. Query Performance Optimization
- **Date:** 2026-05-21
- **Category:** `maintenance`
- **Visibility:** `team`
- **Tags:** `database`, `performance`
- **Did Today:** Analyzed slow query logs and optimized 5 critical database queries. Added composite indexes.
- **Learned Today:** Learned about PostgreSQL EXPLAIN ANALYZE and query planning strategies.
- **Next Plan:** Continue monitoring query performance after index changes.
- **🏆 Achievement Linked:** Yes

---

## 🏆 Achievements

| Journal | Title | Description | Impact | Importance | Date |
|---|---|---|---|---|---|
| #2 (DB Migration) | Successfully migrated production database to PostgreSQL 16 | Led the full migration from PostgreSQL 14 to 16 with zero data loss and minimal downtime. | Reduced deployment downtime by 80% and improved query performance by 30%. | `critical` | 2026-05-17 |
| #3 (Auth Refactor) | Implemented JWT refresh token authentication | Refactored the entire auth module to use JWT with refresh tokens and added rate limiting. | Reduced login failures by 60% and improved security posture. | `high` | 2026-05-18 |
| #5 (Security Incident) | Resolved critical security incident within 4 hours | Identified, investigated, and resolved an unauthorized access attempt. Patched vulnerability and updated security policies. | Prevented potential data breach affecting 10,000+ user records. | `critical` | 2026-05-20 |
| #6 (Query Optimization) | Optimized 5 critical database queries | Analyzed slow query logs and restructured queries with proper indexing strategy. | API response time improved by 60% on key endpoints. | `high` | 2026-05-21 |
