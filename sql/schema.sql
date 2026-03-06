CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

DROP TYPE IF EXISTS "public"."journal_category";
CREATE TYPE "public"."journal_category" AS ENUM (
  'general', 'feature', 'bugfix', 'deployment', 'review', 'learning', 'maintenance'
);

CREATE TABLE "public"."journals" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "entry_date" date NOT NULL,
    "title" varchar(255),
    "did_today" text,
    "learned_today" text,
    "category" "public"."journal_category" DEFAULT 'general'::journal_category,
    "blockers" text,
    "next_plan" text,
    "tasks_completed" int4 DEFAULT 0,
    "hours_coded" numeric(4,1),
    "mood_score" int4 CHECK (mood_score BETWEEN 1 AND 5),
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "deleted_at" timestamp,
    CONSTRAINT "journals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
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
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "journal_id" uuid NOT NULL,
    "file_path" text NOT NULL,
    "file_name" text,
    "file_type" text,
    "file_size" int4,
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "journal_attachments_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

CREATE INDEX idx_attachments_journal ON public.journal_attachments USING btree (journal_id);

CREATE VIEW journal_kpi_summary AS
SELECT
    user_id,
    date_trunc('week', entry_date::timestamp with time zone) AS week,
    date_trunc('month', entry_date::timestamp with time zone) AS month,
    count(*) AS total_entries,
    sum(tasks_completed) AS total_tasks,
    sum(hours_coded) AS total_hours,
    round(avg(mood_score), 2) AS avg_mood,
    mode() WITHIN GROUP (ORDER BY category) AS top_category
FROM journals
WHERE deleted_at IS NULL
GROUP BY user_id,
    date_trunc('week', entry_date::timestamp with time zone),
    date_trunc('month', entry_date::timestamp with time zone);