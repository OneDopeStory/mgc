-- Server-side rate limit for the public AI agent (trueassist.js, visitor mode).
-- One row per IP per UTC day; incremented and checked before every Claude call.
-- Rerunnable — safe to run multiple times.

create table if not exists mgc_ai_rate_limit (
  ip_address  text not null,
  day         date not null default current_date,
  count       integer not null default 0,
  updated_at  timestamptz default now(),
  primary key (ip_address, day)
);

comment on table mgc_ai_rate_limit is
  'Per-IP daily request counter for the public TrueAssist entry point. Checked/incremented in netlify/functions/trueassist.js before calling Anthropic.';
