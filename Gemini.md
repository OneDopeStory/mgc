# Gemini.md

## Pickup Summary

Last updated: 2026-10-28 — see `CLAUDE.md`'s "Current state & open items" section for full detail. Short version this session: drafted a new "Nonprofit Launchpad Advisory Retainer" B2B service line (pricing, Alex intake agent rules, Supabase tagging migration) as an acting-CSO exercise — the real source packet was never supplied, so pricing used a generic placeholder framework; nothing applied/committed. Confirmed CRM tagging approach (extend `mgc_leads`/`mgc_deals` with `consulting_vertical`, not new tables). Discovered the Hostinger Hermes Agent VPS is further along than prior notes showed: a managed Hermes app is already deployed and confirmed alive (chat test succeeded) via Hostinger's AI Router/GPT-6 Luna — next step is finding its Channels settings to wire Telegram/WhatsApp/Slack, and confirming the `@mgcglobalbot` Telegram token was rotated (it was exposed in a screenshot). Researched Kimi/Moonshot API as a possible Claude Code model swap, then owner explicitly decided against it (Orca/Antigravity stays the daily driver) — researched-but-rejected, no code changes.

Previously last updated: 2026-10-27 — restored `admin.html` (was deleted, uncommitted) and added a "Sign in with Google" button to it via Supabase `signInWithOAuth` (the `ADMIN_EMAILS` whitelist still gates access); owner is handling the Supabase/Google Cloud OAuth dashboard config himself. Site-wide hotline number changed to `410-339-8375` (was `443-208-8178`) across the 7 pages that currently exist on disk. Researched xAI's real Voice/SIP telephony API for a planned AI call-center build (architecture: SIP trunk → xAI webhook → WebSocket bridge, belongs on the Hermes Agent VPS, not Netlify) — not started, blocked on VPS access + confirming the phone number is SIP-portable. Several open questions sent to the owner are still unanswered (see CLAUDE.md). Nothing from this session has been committed to git yet.

Previously last updated: 2026-10-23 — Command Center dashboard's Overview tab redesign (icon-rail sidebar, top tab bar, frosted hero cards, live TrueAssist chat, weekly activity grid) across `command-center.html` / `assets/command-center*.{css,js}`. Code done and syntax-checked but not visually verified at the time.

Previously last updated: 2026-06-05

This repo is a static Netlify site served from root. The live client portal is `dashboard.html`, with Supabase auth, database reads/writes, realtime subscriptions, and storage uploads. The AI Operations Front Door is `onboarding-assistant.html`; it posts directly to `/.netlify/functions/lead-intake` and does not call Supabase.

## Supabase / Notion Sync Keys

Use Supabase UUIDs as canonical Notion external IDs. Match by UUID first, then fall back to `email` only when needed.

- Project ref: `bjnpibxaxlgvlzeegwnm`
- Main user key: `mgc_client_profiles.id`
- Shared relation key: `client_id`
- Current Supabase webhook: `mgc_client_profiles` `INSERT` -> `/.netlify/functions/new-client-signup`
- Webhook secret env var: `SUPABASE_WEBHOOK_SECRET`
- Never expose service-role keys, JWT secrets, or webhook secrets in client code.

Canonical mappings:

- Client/contact: `mgc_client_profiles.id`, fallback `email`
- Projects: `mgc_projects.id`, `client_id`
- Deliverables: `mgc_deliverables.id`, `client_id`, `project_id`
- Invoices: `mgc_invoices.id`, `client_id`, `invoice_number`, `stripe_payment_intent_id`
- Bookings: `mgc_bookings.id`, fallback `email`
- Messages: `mgc_messages.id`, `client_id`
- Uploads: `mgc_uploads.id`, `client_id`, `file_url`
- Questionnaires: `mgc_questionnaires.id`, `client_id`

## Next Pickup

- If extending Notion sync, upsert by stored Supabase external ID before creating new pages.
- Add `client_id: currentUser.id` to `mgc_bookings` inserts in `dashboard.html` when tightening booking relations.
- Keep Notion database IDs and secrets in environment variables only.
