-- MGC Global Consulting - Core Portal Tables
-- Run in Supabase Dashboard: SQL Editor > New Query > paste > Run

-- CLIENT PROFILES
create table if not exists mgc_client_profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text,
  company          text,
  phone            text,
  membership_tier  text default 'Enterprise Client',
  avatar_url       text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table mgc_client_profiles enable row level security;

drop policy if exists "Clients can view own profile" on mgc_client_profiles;
create policy "Clients can view own profile"
  on mgc_client_profiles for select
  using (auth.uid() = id);

drop policy if exists "Clients can update own profile" on mgc_client_profiles;
create policy "Clients can update own profile"
  on mgc_client_profiles for update
  using (auth.uid() = id);

drop policy if exists "Clients can insert own profile" on mgc_client_profiles;
create policy "Clients can insert own profile"
  on mgc_client_profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on sign-up (email/password AND Google OAuth)
create or replace function mgc_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.mgc_client_profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure mgc_handle_new_user();


-- PROJECTS
create table if not exists mgc_projects (
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

alter table mgc_projects enable row level security;

drop policy if exists "Clients can view own projects" on mgc_projects;
create policy "Clients can view own projects"
  on mgc_projects for select
  using (auth.uid() = client_id);

create index if not exists idx_mgc_projects_client_id on mgc_projects(client_id);
create index if not exists idx_mgc_projects_status on mgc_projects(status);


-- DELIVERABLES
create table if not exists mgc_deliverables (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references auth.users(id) on delete cascade,
  project_id   uuid references mgc_projects(id) on delete set null,
  title        text not null,
  description  text,
  file_url     text,
  file_type    text,
  status       text check (status in ('pending','in_review','approved','completed')) default 'pending',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table mgc_deliverables enable row level security;

drop policy if exists "Clients can view own deliverables" on mgc_deliverables;
create policy "Clients can view own deliverables"
  on mgc_deliverables for select
  using (auth.uid() = client_id);

create index if not exists idx_mgc_deliverables_client_id on mgc_deliverables(client_id);


-- INVOICES
create table if not exists mgc_invoices (
  id                       uuid primary key default gen_random_uuid(),
  client_id                uuid references auth.users(id) on delete cascade,
  invoice_number           text unique,
  description              text,
  amount_cents             integer not null,
  status                   text check (status in ('draft','sent','paid','overdue','void')) default 'sent',
  due_date                 date,
  paid_at                  timestamptz,
  stripe_payment_intent_id text,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

alter table mgc_invoices enable row level security;

drop policy if exists "Clients can view own invoices" on mgc_invoices;
create policy "Clients can view own invoices"
  on mgc_invoices for select
  using (auth.uid() = client_id);

create index if not exists idx_mgc_invoices_client_id on mgc_invoices(client_id);
create index if not exists idx_mgc_invoices_status on mgc_invoices(status);


-- BOOKINGS
create table if not exists mgc_bookings (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid references auth.users(id) on delete set null,
  name             text not null,
  email            text not null,
  company          text,
  service          text,
  message          text,
  requested_date   date,
  status           text check (status in ('pending','confirmed','completed','cancelled')) default 'pending',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table mgc_bookings enable row level security;

drop policy if exists "Clients can view own bookings" on mgc_bookings;
create policy "Clients can view own bookings"
  on mgc_bookings for select
  using (auth.uid() = client_id or auth.jwt()->>'email' = email);

drop policy if exists "Clients can insert bookings" on mgc_bookings;
create policy "Clients can insert bookings"
  on mgc_bookings for insert
  with check (true);

create index if not exists idx_mgc_bookings_client_id on mgc_bookings(client_id);
create index if not exists idx_mgc_bookings_email on mgc_bookings(email);
create index if not exists idx_mgc_bookings_status on mgc_bookings(status);


-- UPDATED_AT FUNCTION
create or replace function mgc_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on mgc_client_profiles;
create trigger set_updated_at before update on mgc_client_profiles
  for each row execute procedure mgc_set_updated_at();

drop trigger if exists set_updated_at on mgc_projects;
create trigger set_updated_at before update on mgc_projects
  for each row execute procedure mgc_set_updated_at();

drop trigger if exists set_updated_at on mgc_deliverables;
create trigger set_updated_at before update on mgc_deliverables
  for each row execute procedure mgc_set_updated_at();

drop trigger if exists set_updated_at on mgc_invoices;
create trigger set_updated_at before update on mgc_invoices
  for each row execute procedure mgc_set_updated_at();

drop trigger if exists set_updated_at on mgc_bookings;
create trigger set_updated_at before update on mgc_bookings
  for each row execute procedure mgc_set_updated_at();
