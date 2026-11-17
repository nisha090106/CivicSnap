alter table reports
add column if not exists acknowledged_at timestamptz;
