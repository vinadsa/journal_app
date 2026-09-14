-- ========================
-- SEED DATA FOR TESTING (TRACE Career Archive)
-- ========================
-- Run after: make migrate
-- Usage: make seed (or make freshdb)
--
-- Test credentials:
--   Email: kevin@test.com | Password: password123 (Employee / Senior IC)
--   Email: sarah@test.com | Password: password123 (Manager / Engineering Lead)

-- ========================
-- TEAMS
-- ========================

INSERT INTO teams (name) VALUES ('Engineering Team');
INSERT INTO teams (name) VALUES ('Product Team');

-- ========================
-- USERS
-- ========================
-- Password: password123 (bcrypt via pgcrypto)

INSERT INTO users (name, email, password_hash, role, team_id)
VALUES (
    'Kevin',
    'kevin@test.com',
    crypt('password123', gen_salt('bf')),
    'employee',
    1
);

INSERT INTO users (name, email, password_hash, role, team_id)
VALUES (
    'Sarah Manager',
    'sarah@test.com',
    crypt('password123', gen_salt('bf')),
    'manager',
    1
);

-- Set Sarah as manager of Engineering Team
UPDATE teams SET manager_id = (SELECT id FROM users WHERE email = 'sarah@test.com') WHERE id = 1;

-- ========================
-- KPI PERIODS
-- ========================

INSERT INTO kpi_periods (name, start_date, end_date, team_id)
VALUES ('Q2 2026', '2026-04-01', '2026-06-30', 1);

INSERT INTO kpi_periods (name, start_date, end_date, team_id)
VALUES ('Q3 2026', '2026-07-01', '2026-09-30', 1);

-- ========================
-- TAGS
-- ========================

INSERT INTO tags (name) VALUES ('backend');
INSERT INTO tags (name) VALUES ('infrastructure');
INSERT INTO tags (name) VALUES ('database');
INSERT INTO tags (name) VALUES ('security');
INSERT INTO tags (name) VALUES ('performance');
INSERT INTO tags (name) VALUES ('devops');
INSERT INTO tags (name) VALUES ('incident');
INSERT INTO tags (name) VALUES ('mentoring');
INSERT INTO tags (name) VALUES ('refactor');
INSERT INTO tags (name) VALUES ('tech-debt');
INSERT INTO tags (name) VALUES ('architecture');

-- ========================
-- JOURNALS (Kevin - user_id = 1)
-- ========================

-- Q2 2026 (May 2026)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-05-16',
    'Setup CI/CD Pipeline',
    'Configured GitHub Actions for automated testing and deployment. Set up staging environment with automated linting and coverage checks.',
    'Learned about GitHub Actions matrix strategy for multi-version Go testing.',
    'development', 'Docker registry access needed from infra team.', 'Complete deployment to staging.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-05-17',
    'Production Database Migration',
    'Executed the planned migration from PostgreSQL 14 to 16. Ran full data integrity checks and vacuum analyze post-migration.',
    'Learned about pg_upgrade in-place strategy and logical replication fallback mechanics.',
    'maintenance', NULL, 'Monitor performance metrics for 48 hours.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-05-18',
    'Authentication API Refactor',
    'Refactored the authentication module to use JWT with refresh tokens. Added rate limiting on login endpoint with sliding window counters.',
    'Deep dive into bcrypt cost factors and their impact on response times under high concurrency.',
    'development', 'Need security team review before merge.', 'Write integration tests for auth flow.',
    'private', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-05-19',
    'Sprint Planning & Architecture Review',
    'Led sprint planning for Sprint 14. Presented architecture proposal for the distributed notification service.',
    'Learned about event-driven architecture patterns with NATS JetStream.',
    'meeting', NULL, 'Draft ADR for notification service.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-05-20',
    'Security Incident Response',
    'Investigated and resolved unauthorized access attempt on the staging API. Patched the vulnerability and updated firewall rules.',
    'Learned about OWASP API Security Top 10 and rate-limiting best practices.',
    'other', 'Need to update all API keys after incident.', 'Write incident retrospective report.',
    'manager_only', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-05-21',
    'Query Performance Optimization',
    'Analyzed slow query logs and optimized 5 critical database queries. Added composite indexes on heavy lookup tables.',
    'Learned about PostgreSQL EXPLAIN ANALYZE buffer hits and query planning strategies.',
    'maintenance', NULL, 'Continue monitoring query performance after index changes.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

-- Q2 2026 (June 2026 - Additional entries)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-06-03',
    'Legacy Session Deprecation & Token Cleanup',
    'Audited legacy session storage in Redis and deprecated v1 session tokens. Added automated cleanup worker for expired tokens to reclaim memory.',
    'Redis SCAN vs KEYS performance impact on single-threaded event loop.',
    'maintenance', NULL, 'Validate memory reclamation metrics in Grafana.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-06-11',
    'Database Read Replica Routing Architecture Spike',
    'Evaluated pgxpool connection split for read/write queries. Benchmarked latency reduction for heavy analytical read queries on replica.',
    'Replication lag handling using transaction log sequence numbers (LSN).',
    'development', NULL, 'Draft RFC document for team review.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-06-18',
    'Junior Dev Mentoring: Go Concurrency & Channel Patterns',
    'Conducted 1:1 pair programming session with junior engineer on resolving goroutine leaks and race conditions in the background export worker.',
    'Effectiveness of visual race detector diagrams in technical knowledge transfer.',
    'meeting', NULL, 'Review their updated PR tomorrow.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-06-25',
    'Developer Experience: Docker Dev Environment & Makefile Overhaul',
    'Overhauled local development setup with standardized docker-compose services, seed automation, and streamlined Makefile targets.',
    'Docker BuildKit cache mounts can cut cold build times by 65%.',
    'maintenance', NULL, 'Share updated onboarding guide with team.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

-- Q3 2026 (July 2026 - Active Cycle)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-07-03',
    'Q3 Architecture RFC: Distributed Cache Invalidation',
    'Authored RFC-104 proposing Redis Pub/Sub combined with local in-memory LRU for high-throughput cache invalidation across API replicas.',
    'Trade-offs between event-driven invalidation and short TTL caching under high-frequency writes.',
    'development', 'Awaiting feedback from infrastructure team.', 'Build proof-of-concept benchmark suite.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-07-08',
    'Payment Gateway Integration: Midtrans Idempotency Design',
    'Designed and implemented idempotency key validation middleware for incoming checkout requests. Added PostgreSQL advisory locks for concurrent checkout requests.',
    'Advisory lock scoping (transaction vs session) and automatic lock release mechanics on connection close.',
    'development', NULL, 'Implement webhook signature verification.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

-- July 15: Peak Level 2 (2 entries on the same day)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-07-15',
    'OAuth2 Authorization Code Flow with PKCE Implementation',
    'Implemented OAuth2 PKCE authorization endpoint and token exchange. Added cryptographic state verification to protect against CSRF attacks.',
    'RFC 7636 security best practices for public client authentication.',
    'development', NULL, 'Conduct cross-team review.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-07-15',
    'Architecture PR Review: Webhook Security & HMAC Verification',
    'Deep-dive code review on payment webhook endpoints. Recommended constant-time HMAC comparison to eliminate timing side-channel vulnerabilities.',
    'Subtle crypto/subtle timing side-channels in standard string comparison functions.',
    'other', NULL, 'Verify updated patch in staging.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-07-22',
    'PostgreSQL JSONB Audit Log Migration',
    'Migrated legacy audit trail to indexed JSONB columns with GIN index. Wrote backfill migration script with batching to avoid table locks.',
    'GIN index jsonb_path_ops vs jsonb_ops disk storage trade-offs.',
    'maintenance', NULL, 'Monitor index size growth.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-07-29',
    'Disaster Recovery Runbook Drill & Failover Simulation',
    'Authored comprehensive disaster recovery runbook and led staging failover drill simulating primary database node crash and automatic replica promotion.',
    'Stale client connection handling during DNS TTL propagation during replica promotion.',
    'maintenance', NULL, 'Archive drill report in team wiki.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

-- Q3 2026 (August 2026)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-05',
    'Payment Webhook Retry Worker with Exponential Backoff',
    'Built background queue worker for asynchronous payment webhook processing with jittered exponential backoff and dead-letter queue.',
    'Decorrelated jitter algorithms to prevent thundering herd against downstream APIs.',
    'development', NULL, 'Integrate with real-time alerting.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

-- August 12: Peak Level 3 (3 entries on the same day)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-12',
    'Payment Reconciliation Service & Transaction Ledger',
    'Implemented double-entry transaction ledger logic for payment states (pending, captured, settled, refunded). Ensured atomic balance updates.',
    'Strict isolation levels (Serializable vs Repeatable Read) for financial ledgers.',
    'development', NULL, 'Run automated reconciliation tests against Midtrans sandbox.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-12',
    'Mentoring Session: Debugging Deadlocks with Postgres pg_locks',
    'Paired with junior backend developer to analyze deadlock traces from staging logs using pg_locks and pg_stat_activity. Refactored lock acquisition order.',
    'How consistent row locking order across transactions eliminates cyclic deadlock graphs.',
    'meeting', NULL, 'Create a short engineering cheat sheet on database locking rules.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-12',
    'Security Audit Checklist for PCI-DSS Pre-Compliance',
    'Audited API parameters and logging configurations to ensure zero raw credit card or CVV data is ever logged to stdout or persistent storage.',
    'Log masking techniques using regex sanitizers in Go slog middleware.',
    'other', NULL, 'Present audit findings to security lead.',
    'manager_only', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-19',
    'Refactoring Monolithic DB Handlers into Service Layer',
    'Extracted direct SQL queries from HTTP handlers into decoupled repository and service interfaces. Added comprehensive unit tests with mocks.',
    'Clean Architecture dependency inversion boundaries in Go.',
    'maintenance', NULL, 'Continue refactoring remaining endpoints in Phase 2.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

-- August 26: Peak Level 4 (4 entries on the same day - On-Call Incident Day)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-26',
    'P1 Production Incident: Redis Connection Pool Exhaustion',
    'Responded to high-priority pager alert for elevated 504 errors on API gateway. Identified Redis connection pool saturation due to unclosed socket handles in legacy auth middleware.',
    'Importance of strict defer conn.Close() and idle connection timeout tuning.',
    'other', 'Live incident in progress.', 'Deploy pool sizing hotfix immediately.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-26',
    'Hotfix Deployment: Redis Connection Pool Sizing & Idle Timeout',
    'Implemented and deployed emergency hotfix v2.4.1 configuring MaxIdleConns, MaxActiveConns, and 10s idle timeout. Service restored to 100% normal within 45 minutes.',
    'TCP keepalive settings on cloud-managed Redis instances.',
    'maintenance', NULL, 'Draft blameless retrospective for engineering all-hands.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-26',
    'Incident Post-Mortem & Blameless Retrospective Writeup',
    'Conducted 5-Whys root cause analysis and drafted comprehensive incident retrospective. Documented timeline, metrics, business impact, and corrective action items.',
    'Blameless post-mortem culture fosters transparent incident reporting and faster resolution.',
    'meeting', NULL, 'Review corrective action items with team.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-08-26',
    'Production Runbook Update: Redis Sentinel Alerting & Leak Detection',
    'Updated on-call runbook with exact Grafana dashboard links, Redis connection saturation alert thresholds, and automated triage commands for on-call engineers.',
    'Effective runbooks must include specific recovery CLI snippets and rollback steps.',
    'maintenance', NULL, 'Walk through runbook updates in next sprint kickoff.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

-- Q3 2026 (September 2026)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-09-01',
    'Legacy API V1 Deprecation & Route Cleanups',
    'Removed deprecated v1 endpoints that have had zero traffic for 60 days. Cleaned up legacy DTO structs and obsolete serializer code.',
    'Dead code elimination directly reduces binary size and test suite execution time.',
    'maintenance', NULL, 'Notify client teams of complete deprecation.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-09-03',
    'Optimizing Slow N+1 Queries on Dashboard & Activity Feeds',
    'Profiled slow SQL queries using pg_stat_statements. Identified 24 N+1 query patterns in activity feed rendering; replaced with batched IN clauses and joined queries.',
    'Postgres EXPLAIN (ANALYZE, BUFFERS) shared hit blocks analysis.',
    'maintenance', NULL, 'Benchmark dashboard response time under simulated user load.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2026-09-04',
    'Midtrans Live Production Cutover & Zero Downtime Smoke Test',
    'Executed live production cutover for payment processing with canary traffic routing (10% -> 50% -> 100%). Successfully verified end-to-end checkout with zero failed payments.',
    'Canary deployment strategies with automated rollback criteria.',
    'development', NULL, 'Monitor real-time settlement dashboard throughout the weekend.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

-- ========================
-- JOURNALS (Sarah - user_id = 2, Manager)
-- ========================

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'sarah@test.com'), '2026-05-25',
    'Q2 Engineering Hiring Calibration & Pipeline Review',
    'Conducted resume screening calibration with recruiting team. Refined evaluation rubrics for Senior Backend Engineer candidate assessments.',
    'Candidate pipeline velocity improves by 35% with clear rubric alignment prior to phone screens.',
    'meeting', NULL, 'Finalize interview schedule for next week.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'sarah@test.com'), '2026-06-20',
    'Mid-Year Engineering Performance 1-on-1s',
    'Completed mid-year career review 1-on-1s with engineering ICs. Discussed career ladder expectations, growth trajectories, and Q3 goal alignment.',
    'Proactive career path discussions significantly increase engineer retention and motivation.',
    'meeting', NULL, 'Synthesize feedback for leadership review.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'sarah@test.com'), '2026-07-06',
    'Q3 Product Roadmap Alignment & Tech Debt Allocation',
    'Negotiated and finalized Q3 product roadmap with VP of Product. Successfully secured dedicated 25% sprint capacity allocation for critical technical debt refactoring and security enhancements.',
    'Framing tech debt in terms of business downtime risk is the most effective approach with non-technical stakeholders.',
    'meeting', NULL, 'Present finalized roadmap to engineering team.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'sarah@test.com'), '2026-07-24',
    'Staffing & Capacity Planning for Payment Integration Sprint',
    'Mapped out sprint velocity and on-call rotation schedules to support the upcoming high-stakes payment gateway cutover without engineer burnout.',
    'Pairing high-risk architectural sprints with reduced meeting loads improves focus and code quality.',
    'general', NULL, 'Distribute final rotation schedule.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'sarah@test.com'), '2026-08-15',
    'Engineering Health Metrics & Incident Review with Stakeholders',
    'Presented monthly engineering health scorecard to executive leadership, highlighting 99.98% uptime, zero payment failures, and sprint velocity trends.',
    'Visual metrics dashboards build strong cross-functional trust.',
    'meeting', NULL, 'Draft monthly engineering digest.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    (SELECT id FROM users WHERE email = 'sarah@test.com'), '2026-09-02',
    'Sprint Retrospective: Reviewing Q3 Velocity & Production Resilience',
    'Facilitated Q3 wrap-up retrospective. Celebrated the zero-downtime payment launch and reviewed post-mortem takeaways from the Redis incident.',
    'Team psychological safety encourages constructive feedback and continuous operational improvement.',
    'meeting', NULL, 'Incorporate retrospective feedback into Q4 planning.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2026')
);

-- ========================
-- JOURNAL TAGS
-- ========================

-- CI/CD -> infrastructure, devops
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Setup CI/CD Pipeline' AND t.name IN ('infrastructure', 'devops');

-- Production Database Migration -> database, infrastructure
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Production Database Migration' AND t.name IN ('database', 'infrastructure');

-- Authentication API Refactor -> backend, security
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Authentication API Refactor' AND t.name IN ('backend', 'security');

-- Sprint Planning -> backend, architecture
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Sprint Planning & Architecture Review' AND t.name IN ('backend', 'architecture');

-- Security Incident Response -> security, incident
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Security Incident Response' AND t.name IN ('security', 'incident');

-- Query Performance Optimization -> database, performance
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Query Performance Optimization' AND t.name IN ('database', 'performance');

-- Legacy Session Deprecation -> backend, refactor, tech-debt
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Legacy Session Deprecation & Token Cleanup' AND t.name IN ('backend', 'refactor', 'tech-debt');

-- Read Replica Routing -> database, architecture, performance
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Database Read Replica Routing Architecture Spike' AND t.name IN ('database', 'architecture', 'performance');

-- Junior Dev Mentoring -> mentoring, backend
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Junior Dev Mentoring: Go Concurrency & Channel Patterns' AND t.name IN ('mentoring', 'backend');

-- Dev Experience Docker -> devops, infrastructure, tech-debt
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Developer Experience: Docker Dev Environment & Makefile Overhaul' AND t.name IN ('devops', 'infrastructure', 'tech-debt');

-- Q3 Cache Invalidation -> architecture, backend, performance
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Q3 Architecture RFC: Distributed Cache Invalidation' AND t.name IN ('architecture', 'backend', 'performance');

-- Midtrans Idempotency -> backend, security, architecture
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Payment Gateway Integration: Midtrans Idempotency Design' AND t.name IN ('backend', 'security', 'architecture');

-- OAuth2 PKCE -> security, backend
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'OAuth2 Authorization Code Flow with PKCE Implementation' AND t.name IN ('security', 'backend');

-- Webhook PR Review -> security, architecture, mentoring
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Architecture PR Review: Webhook Security & HMAC Verification' AND t.name IN ('security', 'architecture', 'mentoring');

-- JSONB Audit Log -> database, refactor, performance
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'PostgreSQL JSONB Audit Log Migration' AND t.name IN ('database', 'refactor', 'performance');

-- Disaster Recovery -> infrastructure, devops, mentoring
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Disaster Recovery Runbook Drill & Failover Simulation' AND t.name IN ('infrastructure', 'devops', 'mentoring');

-- Payment Webhook Retry Worker -> backend, infrastructure, devops
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Payment Webhook Retry Worker with Exponential Backoff' AND t.name IN ('backend', 'infrastructure', 'devops');

-- Payment Ledger -> backend, database
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Payment Reconciliation Service & Transaction Ledger' AND t.name IN ('backend', 'database');

-- Deadlock Mentoring -> mentoring, database
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Mentoring Session: Debugging Deadlocks with Postgres pg_locks' AND t.name IN ('mentoring', 'database');

-- PCI-DSS Security Audit -> security, devops
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Security Audit Checklist for PCI-DSS Pre-Compliance' AND t.name IN ('security', 'devops');

-- Refactor Service Layer -> refactor, tech-debt, backend
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Refactoring Monolithic DB Handlers into Service Layer' AND t.name IN ('refactor', 'tech-debt', 'backend');

-- Redis Incident P1 -> incident, performance, backend
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'P1 Production Incident: Redis Connection Pool Exhaustion' AND t.name IN ('incident', 'performance', 'backend');

-- Redis Hotfix -> infrastructure, performance, incident
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Hotfix Deployment: Redis Connection Pool Sizing & Idle Timeout' AND t.name IN ('infrastructure', 'performance', 'incident');

-- Retrospective Writeup -> incident, architecture
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Incident Post-Mortem & Blameless Retrospective Writeup' AND t.name IN ('incident', 'architecture');

-- Sentinel Alerting Runbook -> devops, mentoring, infrastructure
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Production Runbook Update: Redis Sentinel Alerting & Leak Detection' AND t.name IN ('devops', 'mentoring', 'infrastructure');

-- V1 Deprecation -> tech-debt, refactor, backend
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Legacy API V1 Deprecation & Route Cleanups' AND t.name IN ('tech-debt', 'refactor', 'backend');

-- N+1 Query Optimization -> database, performance, refactor
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Optimizing Slow N+1 Queries on Dashboard & Activity Feeds' AND t.name IN ('database', 'performance', 'refactor');

-- Midtrans Cutover -> backend, devops, infrastructure
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Midtrans Live Production Cutover & Zero Downtime Smoke Test' AND t.name IN ('backend', 'devops', 'infrastructure');

-- Sarah's Tag Mappings
INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Q2 Engineering Hiring Calibration & Pipeline Review' AND t.name IN ('mentoring');

INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Mid-Year Engineering Performance 1-on-1s' AND t.name IN ('mentoring');

INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Q3 Product Roadmap Alignment & Tech Debt Allocation' AND t.name IN ('architecture', 'tech-debt');

INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Staffing & Capacity Planning for Payment Integration Sprint' AND t.name IN ('devops');

INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Engineering Health Metrics & Incident Review with Stakeholders' AND t.name IN ('incident', 'performance');

INSERT INTO journal_tags (journal_id, tag_id)
SELECT j.id, t.id FROM journals j, tags t WHERE j.title = 'Sprint Retrospective: Reviewing Q3 Velocity & Production Resilience' AND t.name IN ('incident', 'mentoring');

-- ========================
-- ACHIEVEMENTS
-- ========================

-- Achievement 1 (DB Migration)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'Production Database Migration'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Successfully migrated production database to PostgreSQL 16',
    'Led the full migration from PostgreSQL 14 to 16 with zero data loss and minimal downtime.',
    'Reduced deployment downtime by 80% and improved query performance by 30%.',
    'critical', '2026-05-17'
);

-- Achievement 2 (Auth Refactor)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'Authentication API Refactor'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Implemented JWT refresh token authentication',
    'Refactored the entire auth module to use JWT with refresh tokens and added rate limiting.',
    'Reduced login failures by 60% and improved security posture.',
    'high', '2026-05-18'
);

-- Achievement 3 (Security Incident)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'Security Incident Response'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Resolved critical security incident within 4 hours',
    'Identified, investigated, and resolved an unauthorized access attempt. Patched vulnerability and updated security policies.',
    'Prevented potential data breach affecting 10,000+ user records.',
    'critical', '2026-05-20'
);

-- Achievement 4 (Query Optimization)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'Query Performance Optimization'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Optimized 5 critical database queries',
    'Analyzed slow query logs and restructured queries with proper indexing strategy.',
    'API response time improved by 60% on key endpoints.',
    'high', '2026-05-21'
);

-- Achievement 5 (Engineering Onboarding Acceleration)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'Developer Experience: Docker Dev Environment & Makefile Overhaul'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Engineering Onboarding Acceleration & Runbook Archive',
    'Authored comprehensive onboarding documentation, concurrency debugging guides, and containerized local development environments.',
    'Reduced new engineer onboarding setup time from 5 business days to 4 hours with 100% reproducible environments.',
    'medium', '2026-06-26'
);

-- Achievement 6 (Redis Cache Architecture)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'Q3 Architecture RFC: Distributed Cache Invalidation'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Zero-Downtime Distributed Redis Cache Architecture',
    'Architected and implemented distributed caching with Redis Pub/Sub invalidation, multi-replica synchronization, and circuit-breaker fallbacks.',
    'Slashed p99 latency across high-frequency API endpoints by 72% and supported 5,000+ RPS peak load without cache stampedes.',
    'critical', '2026-07-16'
);

-- Achievement 7 (Payment Gateway Integration)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'Payment Gateway Integration: Midtrans Idempotency Design'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Idempotent Payment Gateway Integration with Zero Transaction Loss',
    'Delivered end-to-end Midtrans payment gateway integration featuring cryptographic HMAC validation, atomic double-entry ledgers, and automated webhook retries.',
    'Successfully processed 10,000+ daily checkout transactions with 100% idempotency, zero double-charges, and zero customer payment loss.',
    'critical', '2026-08-14'
);

-- Achievement 8 (Rapid Incident Recovery)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'P1 Production Incident: Redis Connection Pool Exhaustion'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Rapid Incident Triage & Zero Data-Loss Redis Pool Recovery',
    'Triaged, isolated, and hotfixed a critical production connection pool leak under spike load within 45 minutes of first pager alert.',
    'Prevented cascading gateway failure, maintained 100% data integrity, and published blameless retrospective with preventive alert rules.',
    'high', '2026-08-26'
);

-- Achievement 9 (Legacy Monolith Query Refactoring)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    (SELECT id FROM journals WHERE title = 'Optimizing Slow N+1 Queries on Dashboard & Activity Feeds'),
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Legacy Monolith Query Refactoring & Elimination of N+1 Bottlenecks',
    'Systematically analyzed query performance logs, batching queries and eliminating 24 N+1 patterns across feed and review endpoints.',
    'Reduced peak database CPU load by 40% and improved average dashboard load times from 1.8s to 240ms.',
    'high', '2026-09-03'
);

-- ========================
-- ACHIEVEMENT JOURNALS (Evidence Entry - Many-to-Many Pyramid of Evidence)
-- ========================

-- Achievement 1: DB Migration
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Successfully migrated production database to PostgreSQL 16'
  AND j.title IN ('Production Database Migration', 'Query Performance Optimization');

-- Achievement 2: JWT Auth Refactor
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Implemented JWT refresh token authentication'
  AND j.title IN ('Authentication API Refactor', 'Legacy Session Deprecation & Token Cleanup');

-- Achievement 3: Security Incident
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Resolved critical security incident within 4 hours'
  AND j.title = 'Security Incident Response';

-- Achievement 4: Query Optimization
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Optimized 5 critical database queries'
  AND j.title IN ('Query Performance Optimization', 'Database Read Replica Routing Architecture Spike');

-- Achievement 5: Onboarding Acceleration
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Engineering Onboarding Acceleration & Runbook Archive'
  AND j.title IN (
    'Junior Dev Mentoring: Go Concurrency & Channel Patterns',
    'Developer Experience: Docker Dev Environment & Makefile Overhaul'
  );

-- Achievement 6: Redis Cache Architecture
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Zero-Downtime Distributed Redis Cache Architecture'
  AND j.title IN (
    'Q3 Architecture RFC: Distributed Cache Invalidation',
    'Architecture PR Review: Webhook Security & HMAC Verification',
    'Hotfix Deployment: Redis Connection Pool Sizing & Idle Timeout'
  );

-- Achievement 7: Payment Gateway Integration
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Idempotent Payment Gateway Integration with Zero Transaction Loss'
  AND j.title IN (
    'Payment Gateway Integration: Midtrans Idempotency Design',
    'Payment Webhook Retry Worker with Exponential Backoff',
    'Payment Reconciliation Service & Transaction Ledger',
    'Midtrans Live Production Cutover & Zero Downtime Smoke Test'
  );

-- Achievement 8: Rapid Incident Triage & Recovery
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Rapid Incident Triage & Zero Data-Loss Redis Pool Recovery'
  AND j.title IN (
    'P1 Production Incident: Redis Connection Pool Exhaustion',
    'Hotfix Deployment: Redis Connection Pool Sizing & Idle Timeout',
    'Incident Post-Mortem & Blameless Retrospective Writeup',
    'Production Runbook Update: Redis Sentinel Alerting & Leak Detection'
  );

-- Achievement 9: Legacy Monolith Query Refactoring
INSERT INTO achievement_journals (achievement_id, journal_id)
SELECT a.id, j.id FROM achievements a, journals j
WHERE a.title = 'Legacy Monolith Query Refactoring & Elimination of N+1 Bottlenecks'
  AND j.title IN (
    'Refactoring Monolithic DB Handlers into Service Layer',
    'Legacy API V1 Deprecation & Route Cleanups',
    'Optimizing Slow N+1 Queries on Dashboard & Activity Feeds'
  );


-- ========================
-- NEW KPI PERIODS (APPLine V3 Project)
-- ========================
INSERT INTO kpi_periods (name, start_date, end_date, team_id)
VALUES 
('Q1 2025', '2025-01-01', '2025-03-31', 1),
('Q2 2025', '2025-04-01', '2025-06-30', 1),
('Q3 2025', '2025-07-01', '2025-09-30', 1),
('Q4 2025', '2025-10-01', '2025-12-31', 1);

-- ========================
-- ACHIEVEMENTS (APPLine V3 Jamkrida)
-- ========================
INSERT INTO achievements (user_id, title, description, impact, importance, achieved_date)
VALUES 
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Legacy Database Migration to 3NF PostgreSQL',
    'Migrated ~10M+ legacy records from a messy monolithic MySQL database to a clean 3NF PostgreSQL schema. Developed 21+ automated ETL scripts using Python (pandas + SQLAlchemy) with a rollback-first error strategy.',
    'Reduced ~100 legacy tables to <30 normalized tables, drastically improving data integrity and system maintainability for the underwriting pipeline.',
    'critical',
    '2025-03-25'
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'APPLine V3 Frontend & UX Delivery',
    'Delivered ~50% of the UI flows and controller logic for guarantee, certificate, and scoring modules using Laravel + Go headless architecture. Actively gathered feedback from agents and internal staff via UAT.',
    'Eliminated widespread user complaints and workflow bottlenecks. Enabled foolproof UX compliant with OJK POJK11 regulations, greatly reducing data entry errors.',
    'high',
    '2025-06-15'
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Node.js Playwright PDF Service & Security Paper Substitution',
    'Initiated and developed a dedicated microservice for PDF rendering and injection to replace the highly error-prone fpdf/html2pdf legacy system. Substituted physical Security Paper with baked-in HTML templates.',
    'Eliminated format-breaking bugs on guarantee certificates and saved the company tens to hundreds of millions of Rupiah annually by eliminating the need to purchase physical Security Paper.',
    'critical',
    '2025-09-20'
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'),
    'Resolved Catastrophic Production Server Permission Incident',
    'During a critical backend server outage where SSH access and /home directories became completely inaccessible, successfully diagnosed and restored ownership from unknown ID 2000 back to 1000 and revived all PM2 processes.',
    'Restored full production functionality and mitigated extended downtime during a high-pressure scenario with active user complaints.',
    'high',
    '2025-11-10'
);

-- ========================
-- JOURNALS (APPLine V3 Jamkrida)
-- ========================

-- Month 1-3: DB ETL & Design (Q1 2025)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES 
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-01-15',
    'Database Normalization & 3NF Schema Design',
    'Analyzed the legacy MySQL database of APPLine V2. Started designing the new PostgreSQL schema, reducing ~100 redundant tables into a highly normalized 3NF structure.',
    'Learned how deeply technical debt can compound when architectural controls are ignored in a monolithic system.',
    'development', 'Understanding undocumented legacy tables.', 'Finalize the schema for the Underwriting module.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q1 2025')
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-02-10',
    'ETL Pipeline Architecture',
    'Wrote the first batch of Python ETL scripts (pandas + SQLAlchemy) to migrate ~10M+ records. Implemented a rollback-first error strategy with comprehensive log files to ensure zero data loss during migration.',
    'Deep dive into SQLAlchemy bulk inserts and memory management for large datasets in pandas.',
    'development', NULL, 'Test ETL scripts in a staging environment.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q1 2025')
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-03-20',
    'Successful Staging ETL Migration',
    'Executed the staging validation for the DB migration. Processed 10M records successfully and validated data integrity aligned with OJK requirements.',
    'Importance of rigorous logging for troubleshooting missing row relationships in legacy data.',
    'maintenance', NULL, 'Prepare for mock-production validation.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q1 2025')
);

-- Month 4-7: Frontend & UAT (Q2 2025)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES 
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-04-12',
    'UI Flows for Underwriting Credit Module',
    'Developed UI flows and controller logic for the guarantee and scoring modules. Ensured the UX is fool-proof to accommodate POJK11 regulations, especially for Case By Case (CBC) scoring.',
    'Adapting complex financial compliance rules into intuitive frontend logic.',
    'development', NULL, 'Conduct UAT with internal staff.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2025')
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-05-18',
    'UAT Meeting & Empathetic UI Adjustments',
    'Held a UAT meeting with bank agents and internal staff to gather feedback on the new ERP UI. Adjusted the layout to better suit their workflows and reduce workload fatigue.',
    'Direct user feedback is invaluable; understanding their behavior patterns is key to designing an effective ERP interface.',
    'meeting', 'Users are highly resistant to layout changes; need gentle onboarding.', 'Iterate on the certificate module UI.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q2 2025')
);

-- Month 8-10+: PDF Service & Backend Incident (Q3 & Q4 2025)
INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES 
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-07-22',
    'PDF Service Architecture POC',
    'Frustrated by the constant format-breaking bugs from the legacy fpdf/html2pdf tools, I initiated a POC for a dedicated PDF microservice using Node.js and Playwright to render native HTML.',
    'Headless browsers like Playwright offer pixel-perfect rendering which is vastly superior for complex certificate templates.',
    'development', 'Figuring out optimal Playwright instance pooling.', 'Deploy the PDF service to the Jamkrida server.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2025')
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-08-30',
    'Security Paper Substitution Implementation',
    'Successfully baked the intricate security paper formats directly into the HTML templates rendered by the new PDF Service. This completely eliminates the need for expensive physical security paper.',
    'How to handle complex CSS print media queries and injection into PDF Form Acrobat.',
    'development', NULL, 'Push for full adoption by management.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q3 2025')
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-10-15',
    'Backend Fast-track: Golang, Kafka, & Object Storage',
    'Transitioned deeply into backend engineering. Worked on integrating Kafka for the user story logging and set up object storage for robust file handling in the new microservices architecture.',
    'System design trade-offs between synchronous REST APIs and asynchronous event-driven Kafka architectures.',
    'development', NULL, 'Optimize Go service memory footprint.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q4 2025')
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-11-08',
    'Emergency Incident: Server Down & Permission Corruption',
    'The Jamkrida backend server went down with active users complaining. SSH was broken. Once infra restored SSH, we discovered the /home directory ownership was mysteriously changed to unknown ID 2000.',
    'Staying calm under extreme pressure. Also learned how Linux user ID corruptions can paralyze running PM2 processes.',
    'other', 'Extreme stress and scrambling by the whole team.', 'Write a post-mortem and set up stricter permission monitoring.',
    'manager_only', (SELECT id FROM kpi_periods WHERE name = 'Q4 2025')
),
(
    (SELECT id FROM users WHERE email = 'kevin@test.com'), '2025-11-09',
    'Incident Recovery & PM2 Revival',
    'Follow-up on the permission incident: restored /home ownership to ID 1000 and manually revived all PM2 processes. Fully restored system functionality and resolved user complaints.',
    'The importance of having robust, automated service managers and avoiding manual PM2 spawns when possible.',
    'maintenance', NULL, 'Sleep and recover from the weekend maintenance crunch.',
    'team', (SELECT id FROM kpi_periods WHERE name = 'Q4 2025')
);

-- ========================
-- JOURNAL TAGS & ACHIEVEMENT LINKS (APPLine V3)
-- ========================

-- Attach tags and link achievements for the new journals
DO $$
DECLARE
    u_id integer;
    a1_id integer;
    a2_id integer;
    a3_id integer;
    a4_id integer;
    j1_id integer; j2_id integer; j3_id integer; j4_id integer; j5_id integer;
    j6_id integer; j7_id integer; j8_id integer; j9_id integer; j10_id integer;
    t_backend integer; t_infra integer; t_db integer; t_perf integer;
    t_incident integer; t_devops integer; t_architecture integer; t_refactor integer;
BEGIN
    SELECT id INTO u_id FROM users WHERE email = 'kevin@test.com';
    
    -- Get tags
    SELECT id INTO t_backend FROM tags WHERE name = 'backend';
    SELECT id INTO t_infra FROM tags WHERE name = 'infrastructure';
    SELECT id INTO t_db FROM tags WHERE name = 'database';
    SELECT id INTO t_perf FROM tags WHERE name = 'performance';
    SELECT id INTO t_incident FROM tags WHERE name = 'incident';
    SELECT id INTO t_devops FROM tags WHERE name = 'devops';
    SELECT id INTO t_architecture FROM tags WHERE name = 'architecture' LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO tags (name) VALUES ('architecture') RETURNING id INTO t_architecture;
    END IF;
    SELECT id INTO t_refactor FROM tags WHERE name = 'refactor' LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO tags (name) VALUES ('refactor') RETURNING id INTO t_refactor;
    END IF;

    -- Get Achievements
    SELECT id INTO a1_id FROM achievements WHERE title = 'Legacy Database Migration to 3NF PostgreSQL' AND user_id = u_id;
    SELECT id INTO a2_id FROM achievements WHERE title = 'APPLine V3 Frontend & UX Delivery' AND user_id = u_id;
    SELECT id INTO a3_id FROM achievements WHERE title = 'Node.js Playwright PDF Service & Security Paper Substitution' AND user_id = u_id;
    SELECT id INTO a4_id FROM achievements WHERE title = 'Resolved Catastrophic Production Server Permission Incident' AND user_id = u_id;

    -- Get Journals
    SELECT id INTO j1_id FROM journals WHERE title = 'Database Normalization & 3NF Schema Design' AND user_id = u_id;
    SELECT id INTO j2_id FROM journals WHERE title = 'ETL Pipeline Architecture' AND user_id = u_id;
    SELECT id INTO j3_id FROM journals WHERE title = 'Successful Staging ETL Migration' AND user_id = u_id;
    SELECT id INTO j4_id FROM journals WHERE title = 'UI Flows for Underwriting Credit Module' AND user_id = u_id;
    SELECT id INTO j5_id FROM journals WHERE title = 'UAT Meeting & Empathetic UI Adjustments' AND user_id = u_id;
    SELECT id INTO j6_id FROM journals WHERE title = 'PDF Service Architecture POC' AND user_id = u_id;
    SELECT id INTO j7_id FROM journals WHERE title = 'Security Paper Substitution Implementation' AND user_id = u_id;
    SELECT id INTO j8_id FROM journals WHERE title = 'Backend Fast-track: Golang, Kafka, & Object Storage' AND user_id = u_id;
    SELECT id INTO j9_id FROM journals WHERE title = 'Emergency Incident: Server Down & Permission Corruption' AND user_id = u_id;
    SELECT id INTO j10_id FROM journals WHERE title = 'Incident Recovery & PM2 Revival' AND user_id = u_id;

    -- Insert Tags
    -- j1: db, architecture, refactor
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j1_id, t_db), (j1_id, t_architecture), (j1_id, t_refactor) ON CONFLICT DO NOTHING;
    -- j2: db, backend
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j2_id, t_db), (j2_id, t_backend) ON CONFLICT DO NOTHING;
    -- j3: db, perf
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j3_id, t_db), (j3_id, t_perf) ON CONFLICT DO NOTHING;
    -- j4: backend
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j4_id, t_backend) ON CONFLICT DO NOTHING;
    -- j5: 
    -- j6: backend, architecture
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j6_id, t_backend), (j6_id, t_architecture) ON CONFLICT DO NOTHING;
    -- j7: backend
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j7_id, t_backend) ON CONFLICT DO NOTHING;
    -- j8: backend, infra, architecture
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j8_id, t_backend), (j8_id, t_infra), (j8_id, t_architecture) ON CONFLICT DO NOTHING;
    -- j9: incident, infra
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j9_id, t_incident), (j9_id, t_infra) ON CONFLICT DO NOTHING;
    -- j10: incident, devops
    INSERT INTO journal_tags (journal_id, tag_id) VALUES (j10_id, t_incident), (j10_id, t_devops) ON CONFLICT DO NOTHING;

    -- Link Journals to Achievements
    INSERT INTO achievement_journals (achievement_id, journal_id) VALUES 
    (a1_id, j1_id), (a1_id, j2_id), (a1_id, j3_id),
    (a2_id, j4_id), (a2_id, j5_id),
    (a3_id, j6_id), (a3_id, j7_id),
    (a4_id, j9_id), (a4_id, j10_id)
    ON CONFLICT DO NOTHING;

    -- Update achievement journal_id to the most significant journal
    UPDATE achievements SET journal_id = j3_id WHERE id = a1_id;
    UPDATE achievements SET journal_id = j4_id WHERE id = a2_id;
    UPDATE achievements SET journal_id = j7_id WHERE id = a3_id;
    UPDATE achievements SET journal_id = j10_id WHERE id = a4_id;

END $$;

