# AGENTS.md

This file provides guidance to AI coding tools working in this repository. As of 2026-10-27, the owner's primary IDE/tool is **Orca** (mobile + desktop) — Warp is no longer in use. Gemini may still spawn under Antigravity's own rules for specific tasks, but Orca is the default working surface for edits and review.

## Project shape at a glance
- Production site is a **static Netlify site** served from repository root (`netlify.toml` has `publish="."` and no build command).
- Payment and invoicing backend for the live site is in `netlify/functions/`:
  - `create-checkout.js`
  - `payment-webhook.js`
  - `request-invoice.js`
- Client portal is `dashboard.html` (Supabase auth + realtime subscriptions).
- There are two additional Node webhook projects that are operationally related but separate from Netlify deploy flow:
  - `api/` (10-route automation server with its own test suite)
  - `integrations/` (QuickBooks-centric webhook fan-out server)
- `app/` + `utils/supabase/` contains a small Next.js/Supabase SSR scaffold; it is not wired into the Netlify static publish flow described above.

## Working directories and install commands
- Root site + Netlify functions:
  - `npm install`
- Automation server:
  - `cd api && npm install`
- Payment hub server:
  - `cd integrations && npm install`

## Common development commands

### Root (main site + Netlify functions)
- Full local development (site + functions):
  - `npx netlify dev`
- Static-only preview (no functions):
  - `python3 -m http.server 3456`
- Manual production deploy:
  - `npx netlify deploy --prod --dir .`

### Function and endpoint checks
- Smoke test checkout function locally:
  - `curl -X POST http://localhost:8888/.netlify/functions/create-checkout -H "Content-Type: application/json" -d '{"priceId":"price_xxx","mode":"payment"}'`
- Smoke test invoice request:
  - `curl -X POST http://localhost:8888/.netlify/functions/request-invoice -H "Content-Type: application/json" -d '{"service":"AI Strategy Session","amount":2500,"customer_name":"Jane Smith","customer_email":"jane@example.com"}'`

### `api/` automation server
- Start:
  - `cd api && npm start`
- Dev mode (nodemon):
  - `cd api && npm run dev`
- Run test suite:
  - `cd api && npm test`
- Run a single route as a focused smoke test:
  - `curl -X POST http://localhost:3000/webhook/contact-form -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","service":"AI Consulting & Strategy","message":"Test"}'`

### `integrations/` payment hub
- Start:
  - `cd integrations && npm start`
- Dev mode:
  - `cd integrations && npm run dev`
- QuickBooks webhook simulation test:
  - `cd integrations && npm run test:webhook`
- Health check:
  - `curl http://localhost:3001/webhooks/health`

## Build, lint, and test reality
- There is **no build step** for the deployed site (Netlify serves static files from root).
- There is currently **no lint script** defined in root, `api/`, or `integrations/` `package.json`.
- Main automated test entry points that exist now:
  - `cd api && npm test`
  - `cd integrations && npm run test:webhook`

## Architecture details that matter

### 1) Checkout/payment flow (live path)
1. Service/membership pages route users to `checkout.html`.
2. `checkout.html` calls `POST /.netlify/functions/create-checkout`.
3. `create-checkout.js` validates requested price against a server-side allowlist and creates Stripe Checkout sessions.
4. Stripe webhook triggers `payment-webhook.js`.
5. `payment-webhook.js` verifies signature and fans out in parallel (`Promise.allSettled`) to QuickBooks, Google Sheets, Slack, Twilio WhatsApp, and Notion.
6. Failures in one downstream integration should not block webhook success response.

### 2) Invoice-request flow
1. `services.html` invoice modal posts to `POST /.netlify/functions/request-invoice`.
2. `request-invoice.js` validates request, notifies Slack, and attempts QuickBooks invoice creation/email send.
3. Integrations are intentionally decoupled via `Promise.allSettled`-style behavior to avoid hard failure from one provider.

### 3) Client portal flow (`dashboard.html`)
- Uses Supabase JS client directly in-browser (anon key only).
- Auth supports email/password and Google OAuth.
- Data model consumed by the portal uses `mgc_*` tables (projects, invoices, deliverables, etc.).
- Realtime updates are wired through Supabase channel subscriptions for project, invoice, and deliverable updates.

### 4) Deployment and routing
- Netlify redirects in `netlify.toml` map clean paths (e.g. `/services`) to static HTML files.
- Security headers and function CORS are defined in `netlify.toml`; these settings are part of runtime behavior, not cosmetic config.

## Repository conventions and guardrails
- Keep frontend as static HTML/CSS/JS; do not introduce framework build requirements into the main deploy path.
- Keep Stripe pricing server-authoritative (do not bypass `create-checkout.js` allowlist logic).
- Keep function CORS restricted to production origin unless there is an intentional, reviewed reason to expand.
- Do not weaken/remove security headers in `netlify.toml`.
- Use CSS custom properties for shared palette/spacing and preserve cross-page visual consistency (navigation structure and progress UI conventions are expected across pages).
- Keep logo usage consistent with repository convention: `assets/mgc-logo-transparent.png`.
- Supabase service-role credentials must never appear in client-side code.

## Existing guidance files worth checking first
- `README.md` (local dev, deploy, env var inventory, function contracts)
- `CLAUDE.md` (project-specific conventions and integration behavior)

## MGC staff email reference

For MGC email drafting, read [Alex’s shared email instructions](agentic-staffing/alex-trueassist-orchestrator/emails/AGENTS.md) and [email workspace index](agentic-staffing/alex-trueassist-orchestrator/emails/README.md). Customized templates and drafts live inside each staff member’s `emails/` folder. Use the display names in `roles.json`; preserve existing folder slugs. Automatic cloud triggers and Gmail/Slack/Telegram delivery remain unconfigured; local drafts are not sent messages.

## TrueAssist communications and Telegram reference

For Codex work involving TrueAssist/Alex, incoming client, prospect or partnership requests, website portal communications, Telegram, Slack, WhatsApp, or Grok voice translation:

- Read [the TDLib and communications reference](agentic-staffing/alex-trueassist-orchestrator/reference/telegram-tdlib-communications.md) and [the implementation follow-up](agentic-staffing/alex-trueassist-orchestrator/COMMUNICATIONS-FOLLOW-UP.md) before choosing an integration or extending message storage.
- For Hermes installation, cloud connection points, or admin feedback/KPIs, also read [the Hermes source guide](agentic-staffing/alex-trueassist-orchestrator/reference/hermes-agent.md), [the connectivity and feedback brief](agentic-staffing/alex-trueassist-orchestrator/CLOUD-CONNECTIVITY-AND-FEEDBACK.md), and `cloud.md`. Preserve the recorded Hostinger VPS and Telegram Bot API direction; TDLib remains a reference unless a concrete client capability requires reconsideration.
- Owner-reported context (2026-10-27): Tizen Kitchen is on a Cloudflare domain; Slack and WhatsApp connections exist. The exact hostname, Tizen Kitchen's relationship to MGC, and Hermes wiring are unverified. Keep engagement data separate until ownership is established; a domain is not evidence of a deployed backend.
- TDLib provides authorized Telegram client access and a local Telegram cache. Retrieve through its documented API; it is not a shared Slack/WhatsApp/CRM database. Keep channel adapters separate and use MGC's authorized application records for shared client context.
- Distinguish Telegram Bot API workflows from TDLib account/client workflows. Recheck official Telegram and xAI documentation and the installed versions before implementation; “Grok 3.0” alone is not a voice API identifier.
- Preserve conversation ownership, verified identity links, human handoff, and original versus translated text. Do not infer a client's identity across channels from a matching display name.
- This reference does not activate integrations or authorize message delivery. Record implementation and verification evidence in the follow-up; preserve the existing deployment and external-action rules.
