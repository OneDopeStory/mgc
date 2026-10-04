-- MGC portal support tables: client inbox, client uploads, business questionnaire,
-- and the TrueAssist visitor rate limit.
--
-- Additive only. Existing mgc_ tables and their policies are not changed.
-- Owner/admin policies are NOT in this file; they wait for the owner-role step
-- (see docs/ai-employee-dashboard-spec.md, section 5, step 2).

-- Client inbox (dashboard "Inbox" tab).
create table if not exists public.mgc_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users (id) on delete set null,
  client_name text,
  company text,
  category text,
  subject text not null,
  message text not null,
  status text not null default 'unread',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Client file uploads. Files live in the private bucket below; only the storage path is stored.
create table if not exists public.mgc_uploads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  client_name text,
  file_name text not null,
  storage_path text not null,
  file_size bigint,
  description text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Business profile questionnaire (dashboard "Knowledge Base" tab).
create table if not exists public.mgc_questionnaires (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  client_name text,
  company text,
  q1 text,
  q2 text,
  q3 text,
  q4 text,
  q5 text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Visitor daily request counter used by netlify/functions/trueassist.js.
-- Service role only: no policies, and no grants to anon or authenticated.
create table if not exists public.mgc_ai_rate_limit (
  ip_address text not null,
  day date not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (ip_address, day)
);

alter table public.mgc_messages enable row level security;
alter table public.mgc_uploads enable row level security;
alter table public.mgc_questionnaires enable row level security;
alter table public.mgc_ai_rate_limit enable row level security;
revoke all on public.mgc_ai_rate_limit from anon, authenticated;

-- Signed-in clients: send and read only their own rows.
create policy "Clients send own messages" on public.mgc_messages
  for insert to authenticated
  with check (auth.uid() = client_id and status = 'unread');
create policy "Clients read own messages" on public.mgc_messages
  for select to authenticated
  using (auth.uid() = client_id);

create policy "Clients add own uploads" on public.mgc_uploads
  for insert to authenticated
  with check (auth.uid() = client_id);
create policy "Clients read own uploads" on public.mgc_uploads
  for select to authenticated
  using (auth.uid() = client_id);

create policy "Clients submit own questionnaire" on public.mgc_questionnaires
  for insert to authenticated
  with check (auth.uid() = client_id);
create policy "Clients read own questionnaire" on public.mgc_questionnaires
  for select to authenticated
  using (auth.uid() = client_id);

-- Private bucket for client uploads. Each client writes and reads only under their own user id folder.
insert into storage.buckets (id, name, public)
values ('mgc-client-uploads', 'mgc-client-uploads', false)
on conflict (id) do update set public = false;

create policy "Clients upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mgc-client-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Clients read own uploaded files" on storage.objects
  for select to authenticated
  using (bucket_id = 'mgc-client-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
