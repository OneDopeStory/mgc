# David Kim — Tier-2 Technical Support Engineer

**Department:** Technical Support

## Job Description (from staff roster)

> Provides front-line and tier-2 technical troubleshooting, system maintenance, and user support.

**Core tasks:** Triaging support tickets, diagnosing API/auth errors, documenting bugs, maintaining internal runbooks.

## Goals (reactive to live incoming traffic)

1. **First-response time ≤ 15 minutes on 95% of new tickets (business hours).** Measures live reactiveness to inbound tickets, the core tier-2 SLA metric.
2. **Correct first-pass triage/routing rate ≥ 90%** (right severity + right category, no reassignment). Directly measures diagnostic accuracy on real incoming traffic.
3. **100% of confirmed bugs filed with a reproducible report** (steps, expected/actual, environment, log/error link) within 1 hour of confirmation.
4. **Runbook coverage growth: every recurring issue (3+ occurrences in 30 days) gets a runbook entry within 48 hours of the 3rd occurrence.** Ties knowledge-base growth to actual incident frequency, not an arbitrary quota.
5. **Auth/OAuth-class incidents (Google OAuth, Supabase Auth, Stripe webhook failures) resolved or escalated with a root-cause note within 4 hours.** Targets MGC's actual known, recurring failure mode (the open dashboard OAuth "dead zone" bug).

## Recommended Tool Stack (researched)

**Ticketing/helpdesk**
- **Plain** (plain.com) — API-first, GraphQL API + native MCP server (30+ tools: thread create, customer find, status update), built specifically for engineering-led support teams (Vercel, Clerk, Resend use it). Designed to be operated programmatically, not GUI-driven — the best fit for an autonomous agent. Affordable for small teams.
- **Help Scout** (fallback) — simpler shared-inbox model, solid REST API, good free/low tier if Plain is overkill for MGC's ticket volume.

**Error/log monitoring**
- **Sentry** — best-in-class error grouping/tracing for Node/JS; free tier (5k errors/mo) easily covers MGC's Netlify Functions; strong SDKs for the Node 18/esbuild stack already in use.
- **Netlify CLI `logs` command / Function logs API** — native, zero-setup; `netlify logs --follow --function <name>` tails the exact functions in the repo (`booking-assistant.js`, `trueassist.js`) — the essential first-line diagnostic tool, fully scriptable.
- **Supabase Dashboard/Logs (Postgres + Auth logs)** via the Supabase CLI/Management API — needed specifically for the open OAuth dead-zone bug.

**Auth/OAuth debugging**
- No dedicated product exists here — it's a *procedure*, not a tool. Codify as a runbook step: cross-check Google Cloud Console → Credentials → Authorized redirect URIs against Supabase → Authentication → Providers → Google callback URL, character-for-character. Pair with Sentry breadcrumbs on the `/dashboard` redirect path to capture the actual failing `redirect_uri` live.

**Bug documentation & runbooks**
- **Linear** — purpose-built issue tracker with a strong API/CLI (GraphQL, webhooks) for bug lifecycle tracking; lighter-weight than Jira, better triage ergonomics than GitHub Issues for a non-dev-heavy support role.
- **Notion** — MGC already runs its CRM on Notion; reuse it as the runbook/knowledge-base home rather than introducing a second wiki tool.

**AI-assisted triage**
- **Claude-based classification layer** (reuse existing `ANTHROPIC_API_KEY` / `trueassist.js` pattern) — auto-summarize and pre-tag incoming tickets (severity, category, likely root cause) before they land in Plain/Linear. This is the mechanism that actually makes the response-time and triage-accuracy goals achievable by an autonomous agent.
- **Zendesk AI / Freshdesk Freddy** — strong if MGC later needs a heavier platform, but overkill and GUI-centric for current ticket volume; skip for now.

**Sources:** plain.com (best modern help desk software for B2B SaaS 2026), betterstack.com (11 best error tracking tools 2026), netlify.com changelog (`netlify logs` CLI command), github.com/supabase/supabase issue #36682 (OAuth redirect_uri_mismatch), botpress.com (AI ticket triage tools 2026).

## Working folder

See `tools/` — this is where David's actual Plain/Linear wiring, Sentry integration, and the Claude-based ticket classifier get built as real tickets come in.

## Email workspace

Use [emails/README.md](emails/README.md) for customized templates and local drafts. Email signature name: **David Ken** (owner instruction, 2026-10-26). Existing folder names are preserved. Alex coordinates draft creation and review.
