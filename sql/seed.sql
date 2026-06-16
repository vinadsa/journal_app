-- ========================
-- SEED DATA FOR TESTING
-- ========================
-- Run after: make migrate
-- Usage: make seed
--
-- Test credentials:
--   Email: kevin@test.com | Password: password123
--   Email: sarah@test.com | Password: password123

-- ========================
-- TEAMS
-- ========================

INSERT INTO teams (name) VALUES ('Engineering Team');
INSERT INTO teams (name) VALUES ('Product Team');

-- Set manager for Engineering Team (will be updated after users are inserted)

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
UPDATE teams SET manager_id = 2 WHERE id = 1;

-- ========================
-- KPI PERIODS
-- ========================

INSERT INTO kpi_periods (name, start_date, end_date, team_id)
VALUES ('Q2 2026', '2026-04-01', '2026-06-30', 1);

-- ========================
-- JOURNALS (user_id = 1, Kevin)
-- ========================

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    1, '2026-05-16',
    'Setup CI/CD Pipeline',
    'Configured GitHub Actions for automated testing and deployment. Set up staging environment.',
    'Learned about GitHub Actions matrix strategy for multi-version testing.',
    'development', 'Docker registry access needed from infra team.', 'Complete deployment to staging.',
    'team', 1
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    1, '2026-05-17',
    'Production Database Migration',
    'Executed the planned migration from PostgreSQL 14 to 16. Ran full data integrity checks post-migration.',
    'Learned about pg_upgrade in-place strategy and logical replication fallback.',
    'maintenance', NULL, 'Monitor performance metrics for 48 hours.',
    'team', 1
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    1, '2026-05-18',
    'Authentication API Refactor',
    'Refactored the authentication module to use JWT with refresh tokens. Added rate limiting on login endpoint.',
    'Deep dive into bcrypt cost factors and their impact on response time.',
    'development', 'Need security team review before merge.', 'Write integration tests for auth flow.',
    'private', 1
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    1, '2026-05-19',
    'Sprint Planning & Architecture Review',
    'Led sprint planning for Sprint 14. Presented architecture proposal for the notification service.',
    'Learned about event-driven architecture patterns with NATS.',
    'meeting', NULL, 'Draft ADR for notification service.',
    'team', 1
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    1, '2026-05-20',
    'Security Incident Response',
    'Investigated and resolved unauthorized access attempt on the staging API. Patched the vulnerability and updated firewall rules.',
    'Learned about OWASP API Security Top 10 and rate-limiting best practices.',
    'other', 'Need to update all API keys after incident.', 'Write incident retrospective report.',
    'manager_only', 1
);

INSERT INTO journals (user_id, entry_date, title, did_today, learned_today, category, blockers, next_plan, visibility, kpi_period_id)
VALUES (
    1, '2026-05-21',
    'Query Performance Optimization',
    'Analyzed slow query logs and optimized 5 critical database queries. Added composite indexes.',
    'Learned about PostgreSQL EXPLAIN ANALYZE and query planning strategies.',
    'maintenance', NULL, 'Continue monitoring query performance after index changes.',
    'team', 1
);

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

-- ========================
-- JOURNAL TAGS
-- ========================

-- Journal 1 (CI/CD) → devops, infrastructure
INSERT INTO journal_tags (journal_id, tag_id) VALUES (1, 2);
INSERT INTO journal_tags (journal_id, tag_id) VALUES (1, 6);

-- Journal 2 (DB Migration) → database, infrastructure
INSERT INTO journal_tags (journal_id, tag_id) VALUES (2, 3);
INSERT INTO journal_tags (journal_id, tag_id) VALUES (2, 2);

-- Journal 3 (Auth Refactor) → backend, security
INSERT INTO journal_tags (journal_id, tag_id) VALUES (3, 1);
INSERT INTO journal_tags (journal_id, tag_id) VALUES (3, 4);

-- Journal 4 (Sprint Planning) → backend
INSERT INTO journal_tags (journal_id, tag_id) VALUES (4, 1);

-- Journal 5 (Security Incident) → security, incident
INSERT INTO journal_tags (journal_id, tag_id) VALUES (5, 4);
INSERT INTO journal_tags (journal_id, tag_id) VALUES (5, 7);

-- Journal 6 (Query Optimization) → database, performance
INSERT INTO journal_tags (journal_id, tag_id) VALUES (6, 3);
INSERT INTO journal_tags (journal_id, tag_id) VALUES (6, 5);

-- ========================
-- ACHIEVEMENTS
-- ========================

-- Achievement for Journal 2 (DB Migration)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    2, 1,
    'Successfully migrated production database to PostgreSQL 16',
    'Led the full migration from PostgreSQL 14 to 16 with zero data loss and minimal downtime.',
    'Reduced deployment downtime by 80% and improved query performance by 30%.',
    'critical', '2026-05-17'
);

-- Achievement for Journal 3 (Auth Refactor)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    3, 1,
    'Implemented JWT refresh token authentication',
    'Refactored the entire auth module to use JWT with refresh tokens and added rate limiting.',
    'Reduced login failures by 60% and improved security posture.',
    'high', '2026-05-18'
);

-- Achievement for Journal 5 (Security Incident)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    5, 1,
    'Resolved critical security incident within 4 hours',
    'Identified, investigated, and resolved an unauthorized access attempt. Patched vulnerability and updated security policies.',
    'Prevented potential data breach affecting 10,000+ user records.',
    'critical', '2026-05-20'
);

-- Achievement for Journal 6 (Query Optimization)
INSERT INTO achievements (journal_id, user_id, title, description, impact, importance, achieved_date)
VALUES (
    6, 1,
    'Optimized 5 critical database queries',
    'Analyzed slow query logs and restructured queries with proper indexing strategy.',
    'API response time improved by 60% on key endpoints.',
    'high', '2026-05-21'
);
