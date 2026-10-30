-- Nonprofit Launchpad Advisory Retainer — CRM tagging + generated intake documents.
--
-- Decision (2026-10-28): tag the existing mgc_leads/mgc_deals pipeline rather than
-- stand up parallel leads_and_inquiries/crm_pipeline_deals tables, so crm.html's
-- Kanban and Command Center keep working against one pipeline for every vertical.
--
-- Additive and idempotent. NOT auto-applied by this session (no Supabase MCP access
-- to the live MGC project here) — run manually via the Supabase SQL Editor or
-- `supabase db push` for project bjnpib once reviewed. mgc_deals itself (from
-- 20261027190000_mgc_deals.sql) must be applied first; this migration assumes that
-- table already exists.

alter table public.mgc_leads
  add column if not exists consulting_vertical text;
alter table public.mgc_deals
  add column if not exists consulting_vertical text;

comment on column public.mgc_leads.consulting_vertical is
  'Optional service-line tag, e.g. nonprofit_capacity. Null = general/unclassified.';
comment on column public.mgc_deals.consulting_vertical is
  'Optional service-line tag, e.g. nonprofit_capacity. Null = general/unclassified.';

-- Generated Nonprofit Launchpad intake documents (Form 1023 narrative, Maryland SDAT
-- registration profile, modular business plan summary), one row per document per lead.
-- Mirrors the local drafts/<prospect-slug>/manifest.json contract in
-- agentic-staffing/alex-trueassist-orchestrator/nonprofit-intake/ — see that folder's
-- AUTOMATION.md for the sync design this table is the target of.
create table if not exists public.mgc_nonprofit_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.mgc_leads (id) on delete cascade,
  deal_id uuid references public.mgc_deals (id) on delete set null,
  document_type text not null
    check (document_type in ('form_1023_narrative', 'sdat_registration_profile', 'business_plan_summary')),
  content text,
  content_sha256 text,
  missing_fields jsonb not null default '[]'::jsonb,
  -- PROFESSIONAL_REVIEW_REQUIRED is mandatory and permanent for form_1023_narrative and
  -- sdat_registration_profile per nonprofit-intake/AGENTS.md — MGC is not the filer of
  -- record. reviewed_by/reviewed_at record the human (attorney/CPA) sign-off, never Alex.
  review_status text not null default 'BLOCKED_MISSING_FACTS'
    check (review_status in ('BLOCKED_MISSING_FACTS', 'DRAFT_FOR_REVIEW', 'PROFESSIONAL_REVIEW_REQUIRED')),
  reviewed_by text,
  reviewed_at timestamptz,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mgc_nonprofit_documents_lead_idx on public.mgc_nonprofit_documents (lead_id);
create index if not exists mgc_nonprofit_documents_deal_idx on public.mgc_nonprofit_documents (deal_id);

-- Reuses update_updated_at_column() defined in 20261027190000_mgc_deals.sql; defined
-- here too so this migration stands alone.
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists set_updated_at on public.mgc_nonprofit_documents;
create trigger set_updated_at
  before update on public.mgc_nonprofit_documents
  for each row execute function public.update_updated_at_column();

-- ── RLS: admins (public.mgc_is_admin()) read/write all; no direct anon/authenticated access ──
alter table public.mgc_nonprofit_documents enable row level security;
revoke all on public.mgc_nonprofit_documents from anon, authenticated;

drop policy if exists "MGC admins read all" on public.mgc_nonprofit_documents;
create policy "MGC admins read all" on public.mgc_nonprofit_documents
  for select to authenticated using (public.mgc_is_admin());

drop policy if exists "MGC admins write all" on public.mgc_nonprofit_documents;
create policy "MGC admins write all" on public.mgc_nonprofit_documents
  for all to authenticated using (public.mgc_is_admin()) with check (public.mgc_is_admin());
