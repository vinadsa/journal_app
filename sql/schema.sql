CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TYPE IF EXISTS "public"."user_role";
CREATE TYPE "public"."user_role" AS ENUM (
  'employee', 'manager', 'admin'
);

CREATE TABLE teams (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role "public"."user_role" NOT NULL DEFAULT 'employee'::user_role,
    team_id INT REFERENCES teams(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE teams
    ADD COLUMN manager_id INT REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE kpi_periods (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    team_id INT REFERENCES teams(id),
    created_at TIMESTAMP DEFAULT NOW()
);

DROP TYPE IF EXISTS "public"."journal_category";
CREATE TYPE "public"."journal_category" AS ENUM (
    'general', 'maintenance', 'development', 'learning', 'meeting', 'business_trip', 'other'
);

DROP TYPE IF EXISTS "public"."journal_visibility";
CREATE TYPE "public"."journal_visibility" AS ENUM (
    'private', 'team', 'public', 'manager_only'
);

CREATE TABLE "public"."journals" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "user_id" INT NOT NULL,
    "entry_date" date NOT NULL,
    "title" varchar(255),
    "did_today" text,
    "learned_today" text,
    "category" "public"."journal_category" DEFAULT 'general'::journal_category,
    "blockers" text,
    "next_plan" text,
    "tasks_completed" int4 DEFAULT 0,
    "hours_worked" numeric(4,1),
    "visibility" "public"."journal_visibility" DEFAULT 'private'::journal_visibility,
    "kpi_period_id" INT REFERENCES kpi_periods(id),
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "deleted_at" timestamp,
    CONSTRAINT "journals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX journals_user_id_entry_date_key ON public.journals USING btree (user_id, entry_date);
CREATE INDEX idx_journals_user_date ON public.journals USING btree (user_id, entry_date DESC);
CREATE INDEX idx_journals_deleted_at ON public.journals (deleted_at) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journals_updated_at
BEFORE UPDATE ON journals
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE "public"."journal_attachments" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "journal_id" INT NOT NULL,
    "file_path" text NOT NULL,
    "file_name" text,
    "file_type" text,
    "file_size" int4,
    "storage_key" text,
    "thumbnail_path" text,
    "checksum" text,
    "uploaded_by" int REFERENCES users(id),
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "journal_attachments_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

CREATE INDEX idx_attachments_journal ON public.journal_attachments USING btree (journal_id);

CREATE VIEW journal_kpi_summary AS
SELECT
    j.user_id,
    u.team_id,
    j.kpi_period_id,
    date_trunc('week', j.entry_date::timestamptz) AS week,
    date_trunc('month', j.entry_date::timestamptz) AS month,
    count(*)                                        AS total_entries,
    sum(j.tasks_completed)                          AS total_tasks,
    sum(j.hours_worked)                             AS total_hours,
    mode() WITHIN GROUP (ORDER BY j.category)       AS top_category
FROM journals j
JOIN users u ON u.id = j.user_id
WHERE j.deleted_at IS NULL
GROUP BY
    j.user_id,
    u.team_id,
    j.kpi_period_id,
    date_trunc('week', j.entry_date::timestamptz),
    date_trunc('month', j.entry_date::timestamptz);