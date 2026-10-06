-- Client portal: field sync, admin access and onboarding fields.
-- Additive and idempotent: adds columns, policies, triggers and one table. Nothing is dropped
-- except this migration's own policies/triggers, which are recreated.
--
-- Fixes found by probing project bjnpib on 2026-10-05:
--   * dashboard.html inserts mgc_bookings.service_line, which did not exist, so portal booking
--     requests failed with "Failed to submit request".
--   * admin.html gates on an email list in the browser only. Row level security hides every
--     client's rows from that login, so the admin portal shows empty lists. mgc_is_admin()
--     below gives the same accounts read/update access in the database.
--   * Google sign-in relies on mgc_handle_new_user() to create the profile row, but no trigger
--     attaching it to auth.users is in the migration history. It is attached here.

-- ── Admins ────────────────────────────────────────────────────────────────────
create table if not exists public.mgc_admins (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.mgc_admins enable row level security;
-- No policies: only the service role and mgc_is_admin() (security definer) read it.

insert into public.mgc_admins (email) values
  ('markatmgc@gmail.com'),
  ('admin@mgcglobalconsulting.com'),
  ('mgcglobalconsulting@gmail.com')
on conflict (email) do nothing;

create or replace function public.mgc_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mgc_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.mgc_is_admin() from public;
grant execute on function public.mgc_is_admin() to authenticated;

-- ── Profiles: onboarding + integration fields ────────────────────────────────
alter table public.mgc_client_profiles
  add column if not exists industry           text,
  add column if not exists website            text,
  add column if not exists timezone           text not null default 'America/New_York',
  add column if not exists onboarding_status  text not null default 'new',
  add column if not exists stripe_customer_id text,
  add column if not exists notion_contact_id  text,
  add column if not exists slack_channel      text,
  add column if not exists slack_thread_ts    text,
  add column if not exists last_seen_at       timestamptz;

alter table public.mgc_client_profiles drop constraint if exists mgc_client_profiles_onboarding_status_check;
alter table public.mgc_client_profiles add constraint mgc_client_profiles_onboarding_status_check
  check (onboarding_status in ('new', 'questionnaire', 'kickoff', 'active', 'paused', 'offboarded'));

-- Clients may edit their own name, company, phone, industry, website and timezone from the
-- portal. Tier, onboarding stage and integration IDs are set only by MGC (admin or server).
-- (A new row keeps the column default for membership_tier.)
create or replace function public.mgc_protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or public.mgc_is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.onboarding_status  := 'new';
    new.stripe_customer_id := null;
    new.notion_contact_id  := null;
    new.slack_channel      := null;
    new.slack_thread_ts    := null;
  else
    new.membership_tier    := old.membership_tier;
    new.onboarding_status  := old.onboarding_status;
    new.stripe_customer_id := old.stripe_customer_id;
    new.notion_contact_id  := old.notion_contact_id;
    new.slack_channel      := old.slack_channel;
    new.slack_thread_ts    := old.slack_thread_ts;
  end if;
  return new;
end;
$$;

drop trigger if exists mgc_protect_profile_fields on public.mgc_client_profiles;
create trigger mgc_protect_profile_fields
  before insert or update on public.mgc_client_profiles
  for each row execute function public.mgc_protect_profile_fields();

-- Create or refresh the profile row whenever someone signs up (Google or email).
-- mgc_handle_new_user() already upserts, so a second trigger with another name is harmless.
drop trigger if exists mgc_on_auth_user_created on auth.users;
create trigger mgc_on_auth_user_created
  after insert on auth.users
  for each row execute function public.mgc_handle_new_user();

-- ── Bookings ──────────────────────────────────────────────────────────────────
alter table public.mgc_bookings
  add column if not exists service_line      text,
  add column if not exists calendar_event_id text,
  add column if not exists scheduled_start   timestamptz;

-- ── Invoices: payment links and sync IDs ─────────────────────────────────────
alter table public.mgc_invoices
  add column if not exists currency          text not null default 'usd',
  add column if not exists hosted_url        text,
  add column if not exists stripe_invoice_id text,
  add column if not exists qb_invoice_id     text;

create unique index if not exists mgc_invoices_stripe_invoice_id_key
  on public.mgc_invoices (stripe_invoice_id) where stripe_invoice_id is not null;
create unique index if not exists mgc_invoices_qb_invoice_id_key
  on public.mgc_invoices (qb_invoice_id) where qb_invoice_id is not null;

-- ── Approvals queue (Slack #approvals; nothing client-facing is sent unless approved) ──
create table if not exists public.mgc_approvals (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid references auth.users (id) on delete set null,
  agent            text not null,
  channel          text,
  source_thread_ts text,
  approval_ts      text,
  kind             text not null,
  payload          jsonb not null default '{}'::jsonb,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'changes', 'rejected', 'sent')),
  decided_by       text,
  decided_at       timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists mgc_approvals_status_idx on public.mgc_approvals (status, created_at desc);
alter table public.mgc_approvals enable row level security;
-- No client policies: written and read by Netlify functions with the service role.

-- ── Admin access to client data ───────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'mgc_client_profiles', 'mgc_bookings', 'mgc_projects', 'mgc_invoices',
    'mgc_messages', 'mgc_uploads', 'mgc_questionnaires', 'mgc_approvals'
  ] loop
    execute format('drop policy if exists "MGC admins read all" on public.%I', t);
    execute format('create policy "MGC admins read all" on public.%I for select to authenticated using (public.mgc_is_admin())', t);
    execute format('drop policy if exists "MGC admins update all" on public.%I', t);
    execute format('create policy "MGC admins update all" on public.%I for update to authenticated using (public.mgc_is_admin()) with check (public.mgc_is_admin())', t);
  end loop;
end $$;

-- Admins open client uploads from the private bucket.
drop policy if exists "MGC admins read client uploads" on storage.objects;
create policy "MGC admins read client uploads" on storage.objects
  for select to authenticated
  using (bucket_id = 'mgc-client-uploads' and public.mgc_is_admin());

-- ── Lookups by client ─────────────────────────────────────────────────────────
create index if not exists mgc_bookings_client_idx       on public.mgc_bookings (client_id);
create index if not exists mgc_projects_client_idx       on public.mgc_projects (client_id);
create index if not exists mgc_invoices_client_idx       on public.mgc_invoices (client_id);
create index if not exists mgc_messages_client_idx       on public.mgc_messages (client_id);
create index if not exists mgc_uploads_client_idx        on public.mgc_uploads (client_id);
create index if not exists mgc_questionnaires_client_idx on public.mgc_questionnaires (client_id);

-- ── updated_at maintenance ───────────────────────────────────────────────────
create or replace function public.mgc_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['mgc_client_profiles', 'mgc_bookings', 'mgc_projects', 'mgc_messages'] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'updated_at'
    ) then
      execute format('drop trigger if exists mgc_touch_updated_at on public.%I', t);
      execute format('create trigger mgc_touch_updated_at before update on public.%I for each row execute function public.mgc_touch_updated_at()', t);
    end if;
  end loop;
end $$;
