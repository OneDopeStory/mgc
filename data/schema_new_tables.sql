-- MGC Global Consulting — New Portal Tables
-- Run in Supabase SQL Editor
-- Tables: mgc_messages, mgc_uploads, mgc_questionnaires

-- ─── MESSAGES (client → admin inbox) ───────────────────────────────────────
create table if not exists mgc_messages (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references auth.users(id) on delete cascade,
  client_name   text,
  company       text,
  category      text check (category in ('general','modification','issue','urgent')) default 'general',
  subject       text not null,
  message       text not null,
  status        text check (status in ('unread','read','resolved')) default 'unread',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS: clients can insert their own messages; admin reads via service role
alter table mgc_messages enable row level security;

create policy "Client can send messages"
  on mgc_messages for insert
  with check (auth.uid() = client_id);

create policy "Client can view own messages"
  on mgc_messages for select
  using (auth.uid() = client_id);

-- Admin reads all (handled via Supabase service role in Netlify function, or bypass RLS for known admin UIDs)
-- To allow the admin portal (anon key) to read all rows, add an admin policy or use service role key server-side.
-- For the admin dashboard, we use a Supabase function with SECURITY DEFINER or a server function.
-- Simplest approach for the static admin portal: grant SELECT to anon on mgc_messages (admin page is noindex/nofollow)
-- ONLY do this if the admin.html is protected by network-level auth or is acceptable to expose read-only.
-- Uncomment the line below if you want the static admin portal to read messages:
-- create policy "Admin read all messages" on mgc_messages for select using (true);

create index if not exists idx_mgc_messages_client_id on mgc_messages(client_id);
create index if not exists idx_mgc_messages_status on mgc_messages(status);


-- ─── UPLOADS (client file uploads) ──────────────────────────────────────────
create table if not exists mgc_uploads (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references auth.users(id) on delete cascade,
  client_name   text,
  file_name     text not null,
  file_url      text not null,
  file_size     bigint,
  description   text,
  reviewed      boolean default false,
  created_at    timestamptz default now()
);

alter table mgc_uploads enable row level security;

create policy "Client can upload files"
  on mgc_uploads for insert
  with check (auth.uid() = client_id);

create policy "Client can view own uploads"
  on mgc_uploads for select
  using (auth.uid() = client_id);

-- Uncomment for admin portal anon read:
-- create policy "Admin read all uploads" on mgc_uploads for select using (true);

create index if not exists idx_mgc_uploads_client_id on mgc_uploads(client_id);
create index if not exists idx_mgc_uploads_reviewed on mgc_uploads(reviewed);


-- ─── QUESTIONNAIRES (business profile) ──────────────────────────────────────
create table if not exists mgc_questionnaires (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references auth.users(id) on delete cascade,
  client_name   text,
  company       text,
  q1            text,   -- business type & target market
  q2            text,   -- pain points
  q3            text,   -- 90-day goals
  q4            text,   -- tools & tech fluency
  q5            text,   -- investment range
  reviewed      boolean default false,
  created_at    timestamptz default now()
);

alter table mgc_questionnaires enable row level security;

create policy "Client can submit questionnaire"
  on mgc_questionnaires for insert
  with check (auth.uid() = client_id);

create policy "Client can view own questionnaire"
  on mgc_questionnaires for select
  using (auth.uid() = client_id);

-- Uncomment for admin portal anon read:
-- create policy "Admin read all questionnaires" on mgc_questionnaires for select using (true);

create index if not exists idx_mgc_questionnaires_client_id on mgc_questionnaires(client_id);
create index if not exists idx_mgc_questionnaires_reviewed on mgc_questionnaires(reviewed);


-- ─── STORAGE BUCKET ──────────────────────────────────────────────────────────
-- Run in Supabase Storage → New bucket: mgc-client-uploads (private bucket)
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('mgc-client-uploads', 'mgc-client-uploads', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own files
create policy "Authenticated users can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'mgc-client-uploads' and auth.uid()::text = (string_to_array(name, '/'))[1]);

-- Allow users to read their own files
create policy "Users can read own uploads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'mgc-client-uploads' and auth.uid()::text = (string_to_array(name, '/'))[1]);


-- ─── ADMIN POLICY HELPER ─────────────────────────────────────────────────────
-- For the admin.html static portal to read all records via anon key,
-- run these AFTER you are satisfied with your security model:
--
-- create policy "Admin read all messages" on mgc_messages for select using (true);
-- create policy "Admin update messages" on mgc_messages for update using (true);
-- create policy "Admin read all uploads" on mgc_uploads for select using (true);
-- create policy "Admin delete uploads" on mgc_uploads for delete using (true);
-- create policy "Admin read all questionnaires" on mgc_questionnaires for select using (true);
-- create policy "Admin update questionnaires" on mgc_questionnaires for update using (true);
--
-- NOTE: These open read/write to all anon callers. Only do this if admin.html
-- is behind a network-level gate (Netlify password protection, IP allowlist, etc.)
-- or if the data sensitivity is acceptable. The whitelist check in admin.html JS
-- is a client-side gate only — not a true security boundary.
