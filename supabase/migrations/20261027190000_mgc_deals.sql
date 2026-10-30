-- MGC sales pipeline deals — backs the Sales Kanban and Command Overview KPIs in
-- crm.html (previously 100% mock data: const CRM.deals in that file's <script>).
-- Stage list matches the Kanban columns + filter tabs already built in crm.html:
-- Lead, Prospect, Proposal, Negotiation, Won, Lost.
--
-- Additive and idempotent. NOT auto-applied by this session (no Supabase MCP
-- access to the live MGC project here) — run manually via the Supabase SQL
-- Editor or `supabase db push` for project bjnpib once reviewed.

create table if not exists public.mgc_deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.mgc_leads (id) on delete set null,
  company_name text not null,
  contact_name text,
  tier text check (tier in ('Starter', 'Pro', 'Elite')),
  monthly_value numeric(12, 2) not null default 0 check (monthly_value >= 0),
  stage text not null default 'Lead'
    check (stage in ('Lead', 'Prospect', 'Proposal', 'Negotiation', 'Won', 'Lost')),
  source text check (source in ('Referral', 'LinkedIn', 'Webinar', 'Google Ads', 'Cold Outreach', 'Other')),
  assigned_staff_id uuid references public.mgc_staff (id) on delete set null,
  notes text,
  stage_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mgc_deals_lead_idx on public.mgc_deals (lead_id);
create index if not exists mgc_deals_stage_idx on public.mgc_deals (stage);
create index if not exists mgc_deals_staff_idx on public.mgc_deals (assigned_staff_id);
create index if not exists mgc_deals_created_idx on public.mgc_deals (created_at desc);

-- Track stage_changed_at separately from updated_at so "days in stage" is accurate
-- even when other fields (notes, value) are edited without moving the deal.
create or replace function public.mgc_deals_track_stage_change()
returns trigger
language plpgsql
as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at = now();
  end if;
  return new;
end;
$$;
drop trigger if exists mgc_deals_stage_change on public.mgc_deals;
create trigger mgc_deals_stage_change
  before update on public.mgc_deals
  for each row execute function public.mgc_deals_track_stage_change();

-- Reuses the shared update_updated_at_column() function if it already exists from
-- another migration in this batch; defines it here too so this file stands alone.
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists set_updated_at on public.mgc_deals;
create trigger set_updated_at
  before update on public.mgc_deals
  for each row execute function public.update_updated_at_column();

-- ── RLS: admins (public.mgc_is_admin()) read/write all; no direct anon/authenticated access ──
alter table public.mgc_deals enable row level security;
revoke all on public.mgc_deals from anon, authenticated;

drop policy if exists "MGC admins read all" on public.mgc_deals;
create policy "MGC admins read all" on public.mgc_deals
  for select to authenticated using (public.mgc_is_admin());

drop policy if exists "MGC admins write all" on public.mgc_deals;
create policy "MGC admins write all" on public.mgc_deals
  for all to authenticated using (public.mgc_is_admin()) with check (public.mgc_is_admin());

-- ── Realtime: Kanban drag updates and new deals stream to Command Overview live ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mgc_deals'
  ) then
    alter publication supabase_realtime add table public.mgc_deals;
  end if;
end $$;
