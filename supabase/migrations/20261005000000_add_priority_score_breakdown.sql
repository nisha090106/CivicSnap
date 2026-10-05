-- CivicSnap: Persist explainable priority score factors.
-- Apply this upgrade manually in Supabase SQL Editor or through the Supabase CLI.

alter table report_clusters
    add column if not exists priority_score_breakdown jsonb;

-- Downgrade (execute manually as a separate rollback operation)
-- alter table report_clusters drop column if exists priority_score_breakdown;