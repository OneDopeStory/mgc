# Gemini.md

## Pickup Summary

Last updated: 2026-10-23 — see `CLAUDE.md`'s "Session handoff (2026-10-23)" section for full detail. Short version: the Command Center dashboard's Overview tab was redesigned (icon-rail sidebar, top tab bar, frosted hero cards, live TrueAssist chat, weekly activity grid) across `command-center.html` / `assets/command-center*.{css,js}`. Code is done and syntax-checked but NOT visually verified — no browser/screenshot tool was available in that session. Verify in an actual browser before treating it as finished.

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
