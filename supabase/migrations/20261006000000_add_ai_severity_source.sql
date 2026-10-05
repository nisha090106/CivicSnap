-- Record whether severity was produced by image analysis or a category fallback.
alter table reports add column if not exists ai_severity_source text;
