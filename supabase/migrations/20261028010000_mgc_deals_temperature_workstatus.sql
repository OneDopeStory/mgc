-- MGC CRM pipeline — adds the two new tracking dimensions the owner asked for on
-- 2026-10-28, on top of the existing mgc_deals.stage (Lead/Prospect/Proposal/
-- Negotiation/Won/Lost), which stays unchanged — owner was non-committal on
-- dropping "Prospect", so it is left as-is until he says otherwise.
--
-- temperature  — a separate, independently pickable Cold/Warm/Hot dropdown.
--                Not tied to stage: a deal can be "Proposal" + "Cold" if it's gone quiet.
-- work_status  — phase/selection tracking agent-or-human progress on THIS deal right
--                now, independent of sales stage. "To-do" = not yet started, "In
--                Process" = someone (agent or human) is actively working it.
--
-- "Submitted" (forms/CSV/docs/PDFs a client has turned in) is deliberately NOT a
-- new column or table here. public.mgc_uploads already has exactly this shape —
-- client_id, file_name, file_size, description, reviewed boolean, created_at —
-- and reviewed = false already IS the "newly submitted, needs a look" highlight.
-- The CRM UI should query mgc_uploads by client and show a badge when any row has
-- reviewed = false, rather than duplicating that state onto mgc_deals.
--
-- Known gap: mgc_deals only links to a lead_id, and mgc_uploads only links to a
-- signed-up client's auth.users id. A deal has no uploads to show until that lead
-- converts to a portal account (mgc_client_profiles). So the "Submitted" badge can
-- only ever light up post-signup, never during Lead/Prospect/Proposal/Negotiation —
-- that's a real limitation of the current data model, not a bug to silently fix here.
--
-- Additive and idempotent. NOT auto-applied — same manual-review process as the
-- other drafted migrations in this repo.

alter table public.mgc_deals
  add column if not exists temperature text check (temperature in ('Cold', 'Warm', 'Hot')),
  add column if not exists work_status text not null default 'To-do'
    check (work_status in ('To-do', 'In Process'));

create index if not exists mgc_deals_temperature_idx on public.mgc_deals (temperature);
create index if not exists mgc_deals_work_status_idx on public.mgc_deals (work_status);
