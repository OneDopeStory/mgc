-- MGC Command Center tables, admin access, realtime, and the database webhooks that feed
-- slack-notify and intake-ideas. Adopted from handoff/command-center/command_center.sql (2026-10-05).
-- Run in the Supabase SQL Editor for project bjnpib. Additive and idempotent.
--
-- Adds: staff roster (human + agent), time entries, model usage, tasks, agent
-- heartbeat events, and the 4 ideas generated per intake. Gives MGC admins read
-- access (via the existing public.mgc_is_admin()) and turns on realtime.

-- ── Dependency guard: mgc_time_entries/mgc_tasks below and mgc_roi_metrics (separate
-- migration) reference mgc_projects. It was defined in the pre-migrations-folder
-- data/schema_core_tables.sql and is presumed already live, but that was never tracked
-- here — this block makes the dependency safe either way instead of assuming.
create table if not exists public.mgc_projects (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid references auth.users(id) on delete cascade,
  title          text not null,
  description    text,
  status         text check (status in ('active','completed','paused','pending')) default 'active',
  phase          text,
  progress_pct   integer default 0 check (progress_pct between 0 and 100),
  service_type   text,
  start_date     date,
  target_date    date,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table public.mgc_projects enable row level security;
drop policy if exists "Clients can view own projects" on public.mgc_projects;
create policy "Clients can view own projects"
  on public.mgc_projects for select
  using (auth.uid() = client_id);
create index if not exists idx_mgc_projects_client_id on public.mgc_projects(client_id);
create index if not exists idx_mgc_projects_status on public.mgc_projects(status);

-- ── Staff roster: humans and AI agents in one table ──
create table if not exists public.mgc_staff (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('human', 'agent')),
  name text not null,
  role text,
  email text,
  hourly_rate_cents integer check (hourly_rate_cents >= 0),   -- humans only
  default_model text,                                         -- agents only
  status text not null default 'active' check (status in ('active', 'paused', 'offline')),
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Time entries: hours per person per project ──
create table if not exists public.mgc_time_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.mgc_staff (id) on delete cascade,
  project_id uuid references public.mgc_projects (id) on delete set null,
  client_id uuid references auth.users (id) on delete set null,
  entry_date date not null default current_date,
  hours numeric(5,2) not null check (hours > 0 and hours <= 24),
  billable boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists mgc_time_entries_date_idx on public.mgc_time_entries (entry_date desc);

-- ── Model usage: one row per model call (TrueAssist, booking assistant, agents) ──
create table if not exists public.mgc_model_usage (
  id bigint generated always as identity primary key,
  staff_id uuid references public.mgc_staff (id) on delete set null,  -- who ran it
  source text not null,              -- 'trueassist', 'booking-assistant', 'intake-ideas', agent name
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_cents numeric(10,4) not null default 0,
  client_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists mgc_model_usage_created_idx on public.mgc_model_usage (created_at desc);

-- ── Tasks / to-dos ──
create table if not exists public.mgc_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  project_id uuid references public.mgc_projects (id) on delete set null,
  client_id uuid references auth.users (id) on delete set null,
  assignee_id uuid references public.mgc_staff (id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'blocked', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists mgc_tasks_status_idx on public.mgc_tasks (status, due_date);

-- ── Agent heartbeat events: drives the live pulse ──
create table if not exists public.mgc_agent_events (
  id bigint generated always as identity primary key,
  staff_id uuid references public.mgc_staff (id) on delete set null,
  agent text not null,
  event text not null,               -- 'run', 'handoff', 'approval_requested', 'error', 'heartbeat'
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists mgc_agent_events_created_idx on public.mgc_agent_events (created_at desc);

-- ── 4 ideas per intake ──
create table if not exists public.mgc_intake_ideas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.mgc_leads (id) on delete cascade,
  questionnaire_id uuid references public.mgc_questionnaires (id) on delete cascade,
  client_id uuid references auth.users (id) on delete set null,
  company text,
  ideas jsonb not null default '[]'::jsonb,  -- [{title, why, first_step, service_line}] x4
  model text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'sent', 'dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists mgc_intake_ideas_created_idx on public.mgc_intake_ideas (created_at desc);

-- ── Row-level security: admins read/update; service role writes ──
do $$
declare t text;
begin
  foreach t in array array[
    'mgc_staff', 'mgc_time_entries', 'mgc_model_usage', 'mgc_tasks',
    'mgc_agent_events', 'mgc_intake_ideas'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "MGC admins read all" on public.%I', t);
    execute format('create policy "MGC admins read all" on public.%I for select to authenticated using (public.mgc_is_admin())', t);
    execute format('drop policy if exists "MGC admins write all" on public.%I', t);
    execute format('create policy "MGC admins write all" on public.%I for all to authenticated using (public.mgc_is_admin()) with check (public.mgc_is_admin())', t);
  end loop;
end $$;

-- Leads are not admin-readable from the browser yet; the dashboard needs them.
drop policy if exists "MGC admins read all" on public.mgc_leads;
create policy "MGC admins read all" on public.mgc_leads
  for select to authenticated using (public.mgc_is_admin());

-- ── Realtime: stream changes to the dashboard ──
do $$
declare t text;
begin
  foreach t in array array[
    'mgc_leads', 'mgc_bookings', 'mgc_client_profiles', 'mgc_invoices', 'mgc_projects',
    'mgc_questionnaires', 'mgc_approvals', 'mgc_staff', 'mgc_time_entries',
    'mgc_model_usage', 'mgc_tasks', 'mgc_agent_events', 'mgc_intake_ideas'
  ] loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ── Agent roster from the Slack plan (real roster, no numbers) ──
insert into public.mgc_staff (kind, name, role, default_model)
select v.kind, v.name, v.role, v.model
from (values
  ('agent', 'Intake Agent',         'Qualifies leads, writes intake ideas', 'claude-haiku-4-5-20251001'),
  ('agent', 'Client Success Agent', 'Onboarding and check-ins',             'claude-haiku-4-5-20251001'),
  ('agent', 'Billing Agent',        'Invoices and payment follow-up',       'claude-haiku-4-5-20251001'),
  ('agent', 'Outreach Agent',       'Email outreach drafts',                'claude-haiku-4-5-20251001'),
  ('agent', 'Ops Monitor',          'Watches functions and webhooks',       'claude-haiku-4-5-20251001')
) as v(kind, name, role, model)
where not exists (select 1 from public.mgc_staff s where s.name = v.name);

-- ── Database webhooks (replaces clicking 8 webhooks in the dashboard) ──────────
-- Posts the Supabase webhook payload { type, table, schema, record, old_record } with pg_net,
-- asynchronously, so inserts never wait on Slack or the model. The shared secret is read from
-- Supabase Vault (name: mgc_webhook_secret) so it is never stored in this file or in git.
-- One-time, run separately with the value of SLACK_NOTIFY_SECRET from Netlify:
--   select vault.create_secret('<SLACK_NOTIFY_SECRET value>', 'mgc_webhook_secret');
create extension if not exists pg_net schema extensions;

create or replace function public.mgc_forward_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'mgc_webhook_secret' limit 1;
  if secret is null then
    return new; -- not configured yet: skip quietly, the insert still succeeds
  end if;
  perform net.http_post(
    url := tg_argv[0],
    body := jsonb_build_object(
      'type', tg_op, 'table', tg_table_name, 'schema', tg_table_schema,
      'record', to_jsonb(new), 'old_record', null
    ),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
    timeout_milliseconds := coalesce(nullif(tg_argv[1], '')::int, 5000)
  );
  return new;
end;
$$;
revoke all on function public.mgc_forward_insert() from public, anon, authenticated;

do $$
declare t text;
begin
  -- Every new inquiry, booking and portal action → Slack card (slack-notify.js).
  -- Table-existence checked first so a not-yet-created table never breaks the migration.
  foreach t in array array[
    'mgc_leads', 'mgc_bookings', 'mgc_client_profiles', 'mgc_messages', 'mgc_uploads', 'mgc_questionnaires'
  ] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('drop trigger if exists mgc_slack_notify on public.%I', t);
      execute format(
        'create trigger mgc_slack_notify after insert on public.%I for each row execute function public.mgc_forward_insert(%L, %L)',
        t, 'https://mgcglobalconsulting.com/.netlify/functions/slack-notify', '5000');
    end if;
  end loop;
  -- New leads and questionnaires → 4 tailored ideas (intake-ideas.js). The model call takes a few seconds.
  foreach t in array array['mgc_leads', 'mgc_questionnaires'] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('drop trigger if exists mgc_intake_ideas on public.%I', t);
      execute format(
        'create trigger mgc_intake_ideas after insert on public.%I for each row execute function public.mgc_forward_insert(%L, %L)',
        t, 'https://mgcglobalconsulting.com/.netlify/functions/intake-ideas', '15000');
    end if;
  end loop;
end $$;
