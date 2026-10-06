-- Rotating OAuth refresh tokens for server-side integrations (QuickBooks first).
-- Intuit changes the refresh token value about every 24 hours; request-invoice.js saves the newest
-- one here so the integration keeps working. Service role only: no client policies.
create table if not exists public.mgc_integration_tokens (
  provider      text primary key,
  refresh_token text not null,
  expires_at    timestamptz,
  updated_at    timestamptz not null default now()
);
alter table public.mgc_integration_tokens enable row level security;
revoke all on public.mgc_integration_tokens from anon, authenticated;
