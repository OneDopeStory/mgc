-- MGC ROI metrics: per-account, per-deliverable hours/dollar savings so clients
-- can see ROI specific to their own account in the client portal, and admins can
-- see it rolled up in Command Center. Drafted 2026-10-27 per owner request.
-- Additive and idempotent. Run in the Supabase SQL Editor (or `supabase db push`)
-- for project bjnpib — NOT auto-applied by this session. Review table/column names
-- against anything the Command Center thread has already shipped before running,
-- since both live under supabase/migrations/.

-- ── One row per delivered automation/build/project with an estimated or verified saving ──
create table if not exists public.mgc_roi_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.mgc_projects (id) on delete set null,
  category text not null check (category in (
    'automation_build', 'crm_optimization', 'systems_design',
    'ai_workshop', 'ai_consulting', 'retainer_support'
  )),
  title text not null,                      -- e.g. "Lead intake Zapier automation"
  baseline_description text,                 -- what the manual process looked like before
  hours_saved_per_week numeric(6,2) check (hours_saved_per_week >= 0),
  hourly_rate_assumed_cents integer check (hourly_rate_assumed_cents >= 0),
  dollar_value_per_month_cents integer generated always as (
    case
      when hours_saved_per_week is not null and hourly_rate_assumed_cents is not null
      then round(hours_saved_per_week * 4.33 * hourly_rate_assumed_cents)::integer
      else null
    end
  ) stored,
  evidence_url text,                         -- link to proof: screenshot, deliverable doc, before/after
  status text not null default 'estimated' check (status in ('estimated', 'verified')),
  verified_by text,                          -- staff name/persona who verified it
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists mgc_roi_metrics_client_idx on public.mgc_roi_metrics (client_id, created_at desc);

-- ── Per-client rollup for dashboard cards ──
create or replace view public.mgc_roi_summary as
select
  client_id,
  count(*) as items_count,
  count(*) filter (where status = 'verified') as verified_count,
  sum(hours_saved_per_week) as total_hours_saved_per_week,
  sum(dollar_value_per_month_cents) as total_dollar_value_per_month_cents,
  min(created_at) as first_item_at,
  max(created_at) as last_item_at
from public.mgc_roi_metrics
group by client_id;

-- ── RLS: clients see only their own rows; admins see/write all ──
alter table public.mgc_roi_metrics enable row level security;

create policy "Clients read own ROI metrics" on public.mgc_roi_metrics
  for select to authenticated using (auth.uid() = client_id);

create policy "MGC admins read all ROI metrics" on public.mgc_roi_metrics
  for select to authenticated using (public.mgc_is_admin());

create policy "MGC admins write all ROI metrics" on public.mgc_roi_metrics
  for all to authenticated using (public.mgc_is_admin()) with check (public.mgc_is_admin());

-- ── Realtime, so the client portal / Command Center can stream new entries ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mgc_roi_metrics'
  ) then
    alter publication supabase_realtime add table public.mgc_roi_metrics;
  end if;
end $$;
