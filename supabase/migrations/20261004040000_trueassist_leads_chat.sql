-- TrueAssist web chat: service pricing, leads, chat sessions and the Slack relay.
--
-- Used by netlify/functions/trueassist.js (/api/chat), netlify/functions/slack-events.js
-- (/api/slack/events) and netlify/lib/leads.js.
-- Additive only. Existing mgc_ tables and their policies are not changed.
-- Prices mirror services.html as of 2026-10-04; edit rows here, not in code.

-- Service catalogue the chat quotes from. Public read of active rows only.
create table if not exists public.mgc_service_pricing (
  slug text primary key,
  name text not null,
  category text not null,
  price_usd integer not null check (price_usd >= 0),
  price_note text,
  summary text,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.mgc_service_pricing (slug, name, category, price_usd, price_note, summary, sort_order) values
  ('ai-readiness-assessment', 'AI Readiness Assessment', 'AI Strategy', 750, 'starting at', 'Audit of tech stack, workflows and data; ranked AI opportunities and an action plan.', 10),
  ('ai-roadmap-90-day', '90-Day AI Roadmap + Implementation', 'AI Strategy', 2450, 'starting at', 'Tool selection, integration architecture, enablement plan, KPIs and phased rollout with bi-weekly check-ins.', 20),
  ('automation-starter-pack', 'Automation Starter Pack', 'Automation', 1500, 'starting at', 'Three production workflows (Zapier, Make or n8n) deployed in two weeks.', 30),
  ('full-automation-build', 'Full Automation Build', 'Automation', 4500, 'starting at', 'Operations audit and unlimited workflows across intake, onboarding, invoicing, reporting and support.', 40),
  ('crm-audit-cleanup', 'CRM Audit & Cleanup', 'CRM', 950, 'starting at', 'HubSpot or Notion CRM audit: data quality, pipeline, automation rules and adoption.', 50),
  ('crm-build-training', 'Full CRM Build + Training', 'CRM', 3800, 'starting at', 'Custom pipeline, automation, dashboards, lead scoring and team training.', 60),
  ('executive-ai-briefing', 'Half-Day Executive AI Briefing', 'Training', 1200, 'starting at', 'Four-hour session for up to 10 leaders, on-site or virtual.', 70),
  ('team-ai-bootcamp', 'Full-Day Team AI Bootcamp', 'Training', 2900, 'starting at', 'Eight-hour hands-on bootcamp for up to 25 team members.', 80),
  ('systems-design', 'Systems Design Engagement', 'Systems', 2200, 'starting at', 'Operating architecture: org chart, decision rights, SOPs, data flows and stack.', 90),
  ('monthly-retainer', 'Monthly Retainer', 'Systems', 1950, 'per month, 3-month minimum', 'Fractional COO hours for AI strategy, automation upkeep and new workflows.', 100),
  ('strategy-session', 'Strategy Session (60 min)', 'Consultation', 160, 'per session', 'One-hour session booked at /book.', 110)
on conflict (slug) do nothing;

-- Leads captured by the chat and the booking assistant. Service role only.
create table if not exists public.mgc_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  company text,
  phone text,
  interest text,
  message text,
  source text not null default 'trueassist',
  chat_session_id uuid,
  status text not null default 'new',
  email_sent_at timestamptz,
  slack_notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists mgc_leads_email_idx on public.mgc_leads (lower(email));
create index if not exists mgc_leads_created_idx on public.mgc_leads (created_at desc);

-- One row per web chat. The browser holds a random token; only its SHA-256 hash is stored.
-- mode: 'ai' (Claude answers), 'human' (team replies from Slack), 'closed'.
create table if not exists public.mgc_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  client_id uuid references auth.users (id) on delete set null,
  lead_id uuid references public.mgc_leads (id) on delete set null,
  mode text not null default 'ai' check (mode in ('ai', 'human', 'closed')),
  slack_channel text,
  slack_thread_ts text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create unique index if not exists mgc_chat_sessions_thread_idx
  on public.mgc_chat_sessions (slack_channel, slack_thread_ts) where slack_thread_ts is not null;

alter table public.mgc_leads
  drop constraint if exists mgc_leads_chat_session_fk,
  add constraint mgc_leads_chat_session_fk
    foreign key (chat_session_id) references public.mgc_chat_sessions (id) on delete set null;

-- Transcript. role: 'user' (visitor), 'assistant' (Claude), 'agent' (team or relay bot via Slack).
create table if not exists public.mgc_chat_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.mgc_chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'agent')),
  content text not null,
  source text not null default 'web',
  author text,
  slack_ts text,
  created_at timestamptz not null default now()
);
create index if not exists mgc_chat_messages_session_idx on public.mgc_chat_messages (session_id, id);
-- Slack retries the same event; this keeps a relayed reply from being stored twice.
-- A full constraint (not a partial index) so PostgREST on_conflict can target it; NULLs stay distinct.
alter table public.mgc_chat_messages
  drop constraint if exists mgc_chat_messages_slack_ts_key,
  add constraint mgc_chat_messages_slack_ts_key unique (session_id, slack_ts);

alter table public.mgc_service_pricing enable row level security;
alter table public.mgc_leads enable row level security;
alter table public.mgc_chat_sessions enable row level security;
alter table public.mgc_chat_messages enable row level security;

-- Pricing is public. Everything else is written and read by Netlify functions with the service role.
create policy "Anyone reads active pricing" on public.mgc_service_pricing
  for select to anon, authenticated
  using (active);
revoke insert, update, delete on public.mgc_service_pricing from anon, authenticated;
revoke all on public.mgc_leads from anon, authenticated;
revoke all on public.mgc_chat_sessions from anon, authenticated;
revoke all on public.mgc_chat_messages from anon, authenticated;
