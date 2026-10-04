# TrueAssist architecture: web chat, leads, email, Slack relay

Built 2026-10-04. Not deployed. Hosting is Netlify (static site + Netlify Functions); the Vercel project is a dead leftover, so nothing here targets Vercel.

## Request flow

```
Visitor widget (index.html, assets/trueassist-widget.js)
  │ POST /api/chat {messages, session_id, session_token}
  ▼
netlify/functions/trueassist.js ──► Supabase mgc_service_pricing (prices in the prompt)
  │  Claude Haiku + tools                ▲
  │   save_lead ───► netlify/lib/leads.js recordLead()
  │                     ├─► Supabase mgc_leads
  │                     ├─► Resend: HTML welcome / confirmation email
  │                     └─► SLACK_WEBHOOK_URL: lead summary card
  │   escalate_to_team ─► Slack chat.postMessage (bot) opens a thread in SLACK_RELAY_CHANNEL_ID
  │  every turn ──► mgc_chat_messages (transcript) and, once a thread exists, mirrored into it
  ▼
Slack thread reply ─► POST /api/slack/events (netlify/functions/slack-events.js)
  │  signature check → mgc_chat_messages role 'agent' → session mode 'human'
  ▼
Widget polls GET /api/chat?session_id&session_token&after → shows "Mark at MGC: …"
```

Bookings from `/book` (`booking-assistant.js`) call the same `recordLead()`, so each booking also gets a Supabase lead row, a confirmation email and a Slack card. The existing Notion sync is unchanged.

## Files

| File | Status | What it does |
|---|---|---|
| `netlify/functions/trueassist.js` | changed | Now `/api/chat`. Adds pricing lookup, `save_lead` and `escalate_to_team` tools, chat sessions (random token, hashed in DB), transcript logging, Slack mirroring, human-takeover mode, and `GET` polling. Signed-in client context and visitor rate limit are kept. Runs stateless as before if `SUPABASE_SERVICE_ROLE_KEY` is missing. |
| `netlify/functions/slack-events.js` | new | `/api/slack/events`. Verifies Slack signatures, answers `url_verification`, ignores retries, relays thread replies to the chat. `!ai` hands back to TrueAssist, `!close` ends the chat. |
| `netlify/lib/leads.js` | new | Shared helpers: Supabase REST (service role), cached pricing, `recordLead()`, Resend email with HTML template, Slack webhook card, Slack Web API. Outside `netlify/functions` so it is bundled, not deployed as an endpoint. |
| `netlify/functions/booking-assistant.js` | changed | Calls `recordLead()` after a booking. |
| `netlify.toml` | changed | Rewrites `/api/chat` → `trueassist`, `/api/slack/events` → `slack-events`. Security headers untouched. |
| `supabase/migrations/20261004040000_trueassist_leads_chat.sql` | new | `mgc_service_pricing` (seeded from services.html, public read), `mgc_leads`, `mgc_chat_sessions`, `mgc_chat_messages` (service role only, RLS on). |
| `assets/trueassist-widget.js`, `.css` | changed | Uses `/api/chat`, keeps the session in sessionStorage, polls for team replies only after a handoff, shows team replies with a gold "MGC" avatar. |

The table is `mgc_leads`, not `leads`, to follow the `mgc_` prefix rule.

## Environment variables (Netlify → Site configuration → Environment variables)

New, needed for this feature:

| Name | Needed for | Notes |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Lead card | Incoming webhook for the leads channel. |
| `SLACK_BOT_TOKEN` | Handoff thread, mirroring, relay | `xoxb-…` from the Slack app. Scopes: `chat:write`, `channels:history` (or `groups:history` for a private channel), optional `users:read` for first names. |
| `SLACK_SIGNING_SECRET` | `/api/slack/events` | Slack app → Basic Information. Without it every Slack request is rejected. |
| `SLACK_RELAY_CHANNEL_ID` | Handoff thread | Channel ID (C…), with the bot invited. |
| `RESEND_API_KEY` | Welcome email | Resend account with mgcglobalconsulting.com verified (SPF/DKIM DNS records). |
| `LEAD_EMAIL_FROM` | Welcome email | e.g. `MGC Global Consulting <hello@mgcglobalconsulting.com>`. |
| `LEAD_EMAIL_REPLY_TO` | optional | Where replies to the welcome email go. |
| `SLACK_RELAY_ALLOWED_BOT_IDS` | optional | Comma list of bot IDs (B…) allowed to answer visitors, e.g. a Claude sub-agent's own Slack app. Never list this app's own bot. |

Already referenced by the site, required here: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (sessions, leads, relay), `SITE_URL`.

Each piece degrades on its own: with no Resend key the lead is still stored and posted to Slack; with no bot token the AI tells the visitor to email instead of promising a handoff.

## Setup steps (none done yet)

1. Apply the migration to the MGC Supabase project (`bjnpibxaxlgvlzeegwnm`).
2. Create a Slack app: enable Incoming Webhooks, add the bot scopes above, install, invite the bot to the relay channel. Under Event Subscriptions set the Request URL to `https://www.mgcglobalconsulting.com/api/slack/events` and subscribe to `message.channels` (or `message.groups`). Slack verifies the URL, so the function must be deployed first.
3. Verify the sending domain in Resend.
4. Add the env vars above in Netlify, then deploy (needs Mark's approval).

## Test locally

`npx netlify dev`, then open http://localhost:8888 and use the TrueAssist panel. Slack events need a public URL (`npx netlify dev --live`).
A mocked end-to-end run (8 scenarios: pricing, lead save + email + Slack card, handoff, signature check, relay with retry dedupe, polling, human mode, `!ai`/`!close`, stateless fallback) passed on 2026-10-04.

## Known limits

- Polling every 6 s, only after a handoff and for 30 minutes of inactivity. Supabase Realtime could replace it later.
- The visitor daily limit counts messages sent while a person is answering too.
- The `mgc_leads` table is not shown in `admin.html` yet.
