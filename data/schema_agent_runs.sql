-- DRAFT. Not applied. Review before running in the Supabase SQL editor.
-- MGC Global Consulting - AI employee run tracking
-- Run in Supabase Dashboard: SQL Editor > New Query > paste > Run
--
-- Idempotent: safe to re-run.
-- Two blocks are COMMENTED OUT and need owner approval before they run:
--   1. Owner read policies (owner check is a TODO)
--   2. Realtime publication (adds mgc_agent_runs to supabase_realtime)
-- No client write policies by design. Writes come only from the server, using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.


-- UPDATED_AT FUNCTION (same body as schema_core_tables.sql; re-creating is a no-op)
create or replace function mgc_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- AGENT RUNS
create table if not exists mgc_agent_runs (
  id                uuid primary key default gen_random_uuid(),
  agent_key         text not null,
  title             text not null,
  status            text not null
                    check (status in ('queued','running','needs_review','complete','failed','cancelled')),
  progress_pct      smallint check (progress_pct between 0 and 100),
  requires_review   boolean not null default false,
  approved_by       text,
  approved_at       timestamptz,
  started_at        timestamptz,
  completed_at      timestamptz,
  output_summary    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  sheets_synced_at  timestamptz,
  sheets_row_key    text unique   -- idempotency key for the Sheets mirror
);

-- Fills sheets_row_key when the writer omits it, so every run has a key.
create or replace function mgc_agent_runs_default_row_key()
returns trigger language plpgsql as $$
begin
  if new.sheets_row_key is null then
    new.sheets_row_key := 'run:' || new.id::text;
  end if;
  return new;
end;
$$;

drop trigger if exists default_row_key on mgc_agent_runs;
create trigger default_row_key before insert on mgc_agent_runs
  for each row execute procedure mgc_agent_runs_default_row_key();

drop trigger if exists set_updated_at on mgc_agent_runs;
create trigger set_updated_at before update on mgc_agent_runs
  for each row execute procedure mgc_set_updated_at();

create index if not exists idx_mgc_agent_runs_status on mgc_agent_runs(status);
create index if not exists idx_mgc_agent_runs_agent_key_created on mgc_agent_runs(agent_key, created_at desc);


-- AGENT RUN EVENTS (append-only log; the server never updates or deletes rows here)
create table if not exists mgc_agent_run_events (
  id                bigserial primary key,
  run_id            uuid not null references mgc_agent_runs(id) on delete cascade,
  ts                timestamptz not null default now(),
  level             text not null default 'info'
                    check (level in ('info','ok','warn','error')),
  message           text not null,
  -- Optional state change carried by the event; projected onto mgc_agent_runs below.
  run_status        text
                    check (run_status in ('queued','running','needs_review','complete','failed','cancelled')),
  run_progress_pct  smallint check (run_progress_pct between 0 and 100)
);

create index if not exists idx_mgc_agent_run_events_run_ts on mgc_agent_run_events(run_id, ts);

-- Projects an event's state onto its run in the same transaction.
create or replace function mgc_project_agent_run_event()
returns trigger language plpgsql as $$
begin
  if new.run_status is not null or new.run_progress_pct is not null then
    update mgc_agent_runs r
       set status          = coalesce(new.run_status, r.status),
           progress_pct    = coalesce(new.run_progress_pct, r.progress_pct),
           requires_review = r.requires_review or coalesce(new.run_status = 'needs_review', false),
           started_at      = case when new.run_status = 'running'
                                  then coalesce(r.started_at, new.ts) else r.started_at end,
           completed_at    = case when new.run_status in ('complete','failed','cancelled')
                                  then coalesce(r.completed_at, new.ts) else r.completed_at end
     where r.id = new.run_id;
  end if;
  return new;
end;
$$;

drop trigger if exists project_run_state on mgc_agent_run_events;
create trigger project_run_state after insert on mgc_agent_run_events
  for each row execute procedure mgc_project_agent_run_event();


-- SHEETS SYNC DEAD LETTERS (failed mirror writes; retried by the nightly reconcile)
create table if not exists mgc_agent_sync_dead_letters (
  id               bigserial primary key,
  created_at       timestamptz not null default now(),
  run_id           uuid references mgc_agent_runs(id) on delete set null,
  tab_name         text check (tab_name in ('Runs','Events')),  -- null = job-level failure
  sheets_row_key   text,
  attempts         smallint not null default 0,
  last_error       text,
  payload          jsonb,
  resolved_at      timestamptz
);

create index if not exists idx_mgc_agent_sync_dead_letters_open
  on mgc_agent_sync_dead_letters(created_at) where resolved_at is null;


-- RLS ON. With no policy, anon and authenticated see zero rows and can write nothing.
alter table mgc_agent_runs enable row level security;
alter table mgc_agent_run_events enable row level security;
alter table mgc_agent_sync_dead_letters enable row level security;

-- Strip default API grants from client roles (defense in depth). Service role is unaffected.
revoke all on mgc_agent_runs, mgc_agent_run_events, mgc_agent_sync_dead_letters
  from anon, authenticated;


-- ============================================================================
-- TODO - OWNER CHECK (NOT ENABLED). Fill in <OWNER_CHECK>, then uncomment.
-- Recommended predicate (no email stored in SQL):
--   (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
-- Set app_metadata.role server-side only (service role / Admin API), then have
-- the owner sign out and back in. Never use user_metadata (user-editable).
-- admin.html's ADMIN_EMAILS list runs in the browser and is not a security boundary.
-- Until this block runs, the dashboard feed stays empty (fails closed).
-- ============================================================================
-- grant select on mgc_agent_runs, mgc_agent_run_events, mgc_agent_sync_dead_letters
--   to authenticated;
--
-- drop policy if exists "Owner can read agent runs" on mgc_agent_runs;
-- create policy "Owner can read agent runs" on mgc_agent_runs
--   for select to authenticated
--   using (<OWNER_CHECK>);
--
-- drop policy if exists "Owner can read agent run events" on mgc_agent_run_events;
-- create policy "Owner can read agent run events" on mgc_agent_run_events
--   for select to authenticated
--   using (<OWNER_CHECK>);
--
-- drop policy if exists "Owner can read sync dead letters" on mgc_agent_sync_dead_letters;
-- create policy "Owner can read sync dead letters" on mgc_agent_sync_dead_letters
--   for select to authenticated
--   using (<OWNER_CHECK>);


-- ============================================================================
-- OWNER APPROVAL REQUIRED - Realtime publication (NOT run by default).
-- Lets the dashboard receive live progress via postgres_changes.
-- Idempotent. Add mgc_agent_run_events too only if the live log view needs it.
-- ============================================================================
-- do $$
-- begin
--   if not exists (select 1 from pg_publication_tables
--                  where pubname = 'supabase_realtime'
--                    and schemaname = 'public'
--                    and tablename = 'mgc_agent_runs') then
--     alter publication supabase_realtime add table public.mgc_agent_runs;
--   end if;
-- end $$;
