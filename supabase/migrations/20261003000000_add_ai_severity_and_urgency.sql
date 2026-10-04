-- CivicSnap: AI severity classification and urgent authority notifications.
-- Apply this upgrade manually in Supabase SQL Editor or through the Supabase CLI.

alter table reports add column if not exists ai_severity_confidence double precision;
alter table reports add column if not exists ai_severity_reasoning text;
alter table reports add column if not exists urgency_flagged boolean not null default false;
alter table reports add column if not exists urgency_notified_at timestamptz;

-- Downgrade (execute manually as a separate rollback operation)
-- alter table reports drop column if exists urgency_notified_at;
-- alter table reports drop column if exists urgency_flagged;
-- alter table reports drop column if exists ai_severity_reasoning;
-- alter table reports drop column if exists ai_severity_confidence;