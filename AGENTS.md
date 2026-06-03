# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

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
