alter table reports
  add column if not exists assigned_worker_name varchar(160),
  add column if not exists assigned_worker_contact varchar(80),
  add column if not exists resolution_photo_url text;

create table if not exists report_updates (
  report_update_id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(report_id) on delete cascade,
  update_type varchar(30) not null default 'progress',
  percentage integer,
  photo_url text not null,
  actor_id varchar(100),
  created_at timestamptz not null default now(),
  constraint ck_report_updates_percentage_range
    check (percentage is null or (percentage >= 0 and percentage <= 100))
);

create index if not exists ix_report_updates_report_created
  on report_updates (report_id, created_at);
