-- CivicSnap: Priority-Based Community Reports
-- Apply this upgrade manually in Supabase SQL Editor or through the Supabase CLI.

-- Upgrade
create table if not exists report_clusters (
    cluster_id uuid primary key default gen_random_uuid(),
    canonical_report_id uuid references reports(report_id),
    status varchar(50) not null default 'active',
    merge_confidence double precision,
    merge_reason text,
    priority_score double precision,
    priority_class varchar(50),
    score_version varchar(50),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists report_cluster_members (
    member_id uuid primary key default gen_random_uuid(),
    report_id uuid not null references reports(report_id),
    cluster_id uuid not null references report_clusters(cluster_id),
    match_score double precision,
    matched_fields jsonb,
    created_by varchar(100),
    created_at timestamptz not null default now()
);

create table if not exists votes (
    vote_id uuid primary key default gen_random_uuid(),
    cluster_id uuid not null references report_clusters(cluster_id),
    citizen_id varchar(100) not null,
    created_at timestamptz not null default now(),
    constraint uq_votes_cluster_citizen unique (cluster_id, citizen_id)
);

create table if not exists comments (
    comment_id uuid primary key default gen_random_uuid(),
    cluster_id uuid not null references report_clusters(cluster_id),
    author_id varchar(100) not null,
    text text not null,
    is_hidden boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists audit_log (
    audit_log_id uuid primary key default gen_random_uuid(),
    entity_type varchar(100) not null,
    entity_id uuid not null,
    action varchar(100) not null,
    actor_id varchar(100),
    details jsonb,
    created_at timestamptz not null default now()
);

create table if not exists external_reports (
    external_report_id uuid primary key default gen_random_uuid(),
    provider varchar(100) not null,
    external_id varchar(255) not null,
    canonical_url text,
    content_metadata jsonb,
    retrieval_state varchar(50) not null default 'pending',
    retrieved_at timestamptz,
    constraint uq_external_reports_provider_external unique (provider, external_id)
);

create table if not exists external_report_links (
    external_report_link_id uuid primary key default gen_random_uuid(),
    external_report_id uuid not null references external_reports(external_report_id),
    cluster_id uuid not null references report_clusters(cluster_id),
    match_confidence double precision,
    match_status varchar(50) not null default 'pending',
    reviewer_id varchar(100),
    created_at timestamptz not null default now(),
    constraint uq_external_report_links_pair unique (external_report_id, cluster_id)
);

create table if not exists external_engagement_snapshots (
    snapshot_id uuid primary key default gen_random_uuid(),
    external_report_id uuid not null references external_reports(external_report_id),
    like_count integer not null default 0,
    repost_count integer not null default 0,
    reply_count integer not null default 0,
    quote_count integer not null default 0,
    captured_at timestamptz not null default now()
);

alter table reports add column if not exists cluster_id uuid;
alter table reports add column if not exists source varchar(50) not null default 'civicsnap';

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'fk_reports_cluster_id'
    ) then
        alter table reports
            add constraint fk_reports_cluster_id
            foreign key (cluster_id) references report_clusters(cluster_id);
    end if;
end $$;

create index if not exists ix_reports_latitude_longitude on reports (latitude, longitude);
create index if not exists ix_reports_category on reports (category);
create index if not exists ix_reports_status on reports (status);
create index if not exists ix_reports_cluster_id on reports (cluster_id);
create index if not exists ix_report_clusters_priority_score on report_clusters (priority_score);
create index if not exists ix_votes_cluster_id on votes (cluster_id);

-- Downgrade (execute manually as a separate rollback operation)
-- alter table reports drop constraint if exists fk_reports_cluster_id;
-- alter table reports drop column if exists cluster_id;
-- alter table reports drop column if exists source;
-- drop table if exists external_engagement_snapshots;
-- drop table if exists external_report_links;
-- drop table if exists external_reports;
-- drop table if exists audit_log;
-- drop table if exists comments;
-- drop table if exists votes;
-- drop table if exists report_cluster_members;
-- drop table if exists report_clusters;