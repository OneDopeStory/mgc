-- DRAFT: not applied. Review, then apply to remote only with owner approval.
-- Fixed offer menu for TrueAssist. Every offer is typed so the $250 floor applies
-- only to project engagements.

alter table public.mgc_service_pricing
  add column if not exists offer_type text not null default 'project'
    check (offer_type in ('project', 'consult', 'retainer')),
  add column if not exists floor_exempt boolean not null default false;

-- The $250 project floor constraint is added at the end, after the consultation row
-- (still typed 'project' by the column default at this point) is retyped as 'consult'.

-- Consultation: $169 per 60 minutes (decided 2026-10-04). Was 160.
update public.mgc_service_pricing
   set price_usd = 169,
       offer_type = 'consult',
       floor_exempt = true,
       summary = 'One-hour session booked at /book.',
       updated_at = now()
 where slug = 'strategy-session';

-- First-time client consultation: $50. Display only until booking payment exists.
insert into public.mgc_service_pricing
  (slug, name, category, price_usd, price_note, summary, offer_type, floor_exempt, sort_order)
values
  ('consult-first-time', 'First-Time Client Consultation (60 min)', 'Consultation', 50,
   'first-time clients only', 'One-hour first session for new clients, booked at /book.',
   'consult', true, 105)
on conflict (slug) do nothing;

-- Retainer tiers (audited 2026-10-04). Replaces the single $1,950 row.
update public.mgc_service_pricing set active = false, updated_at = now()
 where slug = 'monthly-retainer';

insert into public.mgc_service_pricing
  (slug, name, category, price_usd, price_note, summary, offer_type, floor_exempt, sort_order)
values
  ('retainer-starter', 'Retainer: Starter', 'Systems', 199,
   'per month, 3-month minimum', 'Fractional COO hours for AI strategy and automation upkeep.',
   'retainer', true, 101),
  ('retainer-pro', 'Retainer: Pro', 'Systems', 499,
   'per month, 3-month minimum', 'Expanded hours for AI strategy, automation upkeep and new workflows.',
   'retainer', true, 102),
  ('retainer-elite', 'Retainer: Elite', 'Systems', 1299,
   'per month, 3-month minimum', 'Full fractional COO coverage with priority support and new workflows.',
   'retainer', true, 103)
on conflict (slug) do nothing;

-- Project rows keep their current prices. All are at or above $250.
update public.mgc_service_pricing
   set offer_type = 'project'
 where slug in (
   'ai-readiness-assessment', 'ai-roadmap-90-day', 'automation-starter-pack',
   'full-automation-build', 'crm-audit-cleanup', 'crm-build-training',
   'executive-ai-briefing', 'team-ai-bootcamp', 'systems-design'
 );

-- Project engagements may not sit below the $250 floor.
alter table public.mgc_service_pricing
  drop constraint if exists mgc_service_pricing_project_floor;
alter table public.mgc_service_pricing
  add constraint mgc_service_pricing_project_floor
    check (offer_type <> 'project' or price_usd >= 250);
