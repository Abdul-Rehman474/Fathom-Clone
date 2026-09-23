-- 0003_search.sql — GIN indexes on the generated tsvector columns, plus the
-- access/order indexes listed in architecture.md §5.

-- Full-text search
create index if not exists calls_title_tsv_idx on public.calls using gin (title_tsv);
create index if not exists segments_tsv_idx on public.transcript_segments using gin (tsv);
create index if not exists summaries_tsv_idx on public.summaries using gin (tsv);

-- Listing / access
create index if not exists calls_owner_created_idx on public.calls (owner_id, created_at desc);
create index if not exists calls_workspace_created_idx on public.calls (workspace_id, created_at desc);
create index if not exists segments_call_idx on public.transcript_segments (call_id, idx);
create index if not exists highlights_call_start_idx on public.highlights (call_id, start_ms);

-- Lookups used by the pipeline / webhooks
create index if not exists calls_bot_id_idx on public.calls (bot_id);
create index if not exists calls_job_id_idx on public.calls (transcript_job_id);
create index if not exists action_items_call_idx on public.action_items (call_id, position);
create index if not exists highlight_tags_user_idx on public.highlight_tags (user_id, position);
