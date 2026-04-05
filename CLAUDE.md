# CLAUDE.md — MGC Global Consulting

This file provides essential context for AI coding assistants working on this codebase.
Read this before making any changes.

---

## Project Identity

**Site:** MGC Global Consulting
**Domain:** https://www.mgcglobalconsulting.com
**Description:** Enterprise-caliber AI strategy, automation, CRM optimization, and operational systems design for growth-stage businesses.
**Hosting:** Netlify (static site + serverless functions)
**Client Portal:** `/dashboard.html` — Supabase-powered authenticated portal

---

## Tech Stack

| Layer | Technology |
|---|---|
| Site type | Static HTML/CSS/JS — no build step |
| Backend | Netlify Functions (Node.js 18+, esbuild bundler) |
| Auth & Database | Supabase (`https://zppuzfvchqxkzprfkhfz.supabase.co`) |
| Payments | Stripe (Checkout Sessions + Webhooks) |
| Deployment | Netlify (publish dir: `.` root) |
| Package manager | npm |

---

## Directory Structure

```
mgc-site-complete_1/
├── index.html                  # Homepage (1,963 lines)
├── dashboard.html              # Supabase-powered client portal
├── services.html               # Solutions Gallery with filter UI
├── membership.html             # Membership tiers (Starter / Pro / Elite)
├── membership-v2.html          # Alternate membership layout
├── checkout.html               # Stripe checkout redirect
├── thank-you.html              # Post-payment confirmation
├── success.html                # Order success page
├── ai-consulting.html          # Service page
├── ai-workshops.html           # Service page
├── automation.html             # Service page
├── crm-optimization.html       # Service page
├── systems-design.html         # Service page
├── retainer-support.html       # Service page
├── partner-success.html        # Partnership inquiry confirmation
├── 403.html / 404.html / 500.html  # Error pages
│
├── netlify/
│   └── functions/
│       ├── create-checkout.js  # POST — Stripe checkout session
│       ├── payment-webhook.js  # POST — Stripe webhook (5-system fan-out)
│       └── request-invoice.js  # POST — Custom invoice request
│
├── hs-breeze-bridge.js         # HubSpot Breeze integration script
├── netlify.toml                # Deployment + headers + redirects config
├── package.json                # Root: stripe@^17.7.0
├── .env.template               # Required environment variables (reference)
├── robots.txt
├── sitemap.xml
├── schema.jsonld               # Structured data / JSON-LD
│
├── docs/
│   ├── claude_usage_limits.md
│   └── taste-skill-README.md
│
└── [images & videos]           # See DESIGN.md for full asset inventory
```

---

## Page Map

| Route | File | Purpose |
|---|---|---|
| `/` | `index.html` | Homepage — hero, services, why MGC, process, pricing teaser |
| `/dashboard` | `dashboard.html` | Client portal (Supabase auth required) |
| `/services` | `services.html` | Full solutions gallery with filter |
| `/membership` | `membership.html` | Membership tiers + enrollment |
| `/checkout` | `checkout.html` | Stripe checkout redirect handler |
| `/thank-you` | `thank-you.html` | Post-payment confirmation |
| `/ai-consulting` | `ai-consulting.html` | Service detail page |
| `/ai-workshops` | `ai-workshops.html` | Service detail page |
| `/automation` | `automation.html` | Service detail page |
| `/crm-optimization` | `crm-optimization.html` | Service detail page |
| `/systems-design` | `systems-design.html` | Service detail page |
| `/retainer-support` | `retainer-support.html` | Service detail page |
| `/partner-success` | `partner-success.html` | Partnership confirmation |

---

## API Endpoints (Netlify Functions)

### `POST /.netlify/functions/create-checkout`
Creates a Stripe Checkout Session.
**Body:** `{ priceId, mode, customerEmail?, metadata? }`
**Response:** `{ url, sessionId }`
- `mode`: `"payment"` (one-time) or `"subscription"` (membership)
- Price IDs are validated against an allowlist — never pass arbitrary IDs
- Success URL: `/thank-you.html?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `/checkout.html?cancelled=true`

### `POST /.netlify/functions/payment-webhook`
Handles `checkout.session.completed` Stripe events.
Fans out to **5 systems in parallel** (`Promise.allSettled` — no blocking):
1. **QuickBooks** — Create invoice + payment record
2. **Google Sheets** — Append payment row to "Payments" sheet
3. **Slack** — Send formatted payment notification
4. **Twilio WhatsApp** — SMS receipt to customer (E.164 phone required)
5. **Notion** — Update client record status → Active

### `POST /.netlify/functions/request-invoice`
Handles custom invoice requests.
**Body:** `{ service, amount, customer_name, customer_email, company?, note? }`
Fans out to: Slack (notify) + QuickBooks (create draft invoice, due 7 days)

---

## Supabase Schema (Client Portal)

**Project:** `zppuzfvchqxkzprfkhfz.supabase.co`

| Table | Purpose |
|---|---|
| `mgc_client_profiles` | User profiles linked to auth.users (full_name, company, phone, membership_tier) |
| `mgc_projects` | Client projects (title, status, phase, progress_pct, service_type, dates) |
| `mgc_deliverables` | Project files/assets (title, file_url, file_type, status) |
| `mgc_invoices` | Billing records (invoice_number, amount_cents, status, due_date, stripe_payment_intent_id) |
| `mgc_bookings` | Session requests (name, email, service, message, requested_date, status) |

- RLS (Row Level Security) enabled on all tables
- Auto-create profile trigger: `mgc_handle_new_user()` fires on `auth.users` insert
- Auth: email/password + Google OAuth

---

## Integrations Reference

| Service | Purpose | Config location |
|---|---|---|
| **Stripe** | Payments & subscriptions | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in env |
| **Supabase** | Portal auth + database | Credentials in `dashboard.html` (anon key only) |
| **QuickBooks** | Invoicing & accounting | `QB_*` env vars + OAuth refresh token |
| **Google Sheets** | Lead/payment logging | Service account key (base64) in env |
| **Slack** | Payment + request notifications | `SLACK_PAYMENTS_WEBHOOK` in env |
| **Twilio** | WhatsApp SMS receipts | `TWILIO_*` env vars |
| **Notion** | CRM + client tracking | `NOTION_API_KEY`, `NOTION_CLIENTS_DATABASE_ID` |
| **HubSpot** | Forms + Breeze AI agent | Portal ID `245294674` in `hs-breeze-bridge.js` |

---

## Environment Variables

Copy `.env.template` → `.env.local` and fill real values. **Never commit `.env.local`.**

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret (server only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_MEMBERSHIP_STARTER/PRO/ELITE` | Membership price IDs |
| `STRIPE_PRICE_*` | Service-specific price IDs (10 total) |
| `QB_CLIENT_ID` / `QB_CLIENT_SECRET` | QuickBooks OAuth credentials |
| `QB_REFRESH_TOKEN` | QuickBooks OAuth refresh token |
| `QB_REALM_ID` | QuickBooks company ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Sheets service account |
| `GOOGLE_SERVICE_ACCOUNT_KEY_B64` | Sheets key (base64 JSON) |
| `SLACK_PAYMENTS_WEBHOOK` | Slack incoming webhook URL |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio credentials |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender number |
| `NOTION_API_KEY` | Notion integration secret |
| `NOTION_CLIENTS_DATABASE_ID` | Notion clients database ID |
| `SITE_URL` | `https://www.mgcglobalconsulting.com` |

---

## Deployment

**No build step.** Netlify serves the root directory directly.

```bash
# Deploy via CLI
npx netlify deploy --prod --dir .

# Or push to GitHub — Netlify auto-deploys on main branch push
git push origin main
```

**Functions are bundled by esbuild** automatically on deploy. No manual bundling needed.

**Redirects** (defined in `netlify.toml`):
- `/checkout` → `checkout.html`
- `/dashboard` → `dashboard.html`
- `/membership` → `membership.html`
- `/services` → `services.html`
- `/thank-you` → `thank-you.html`

---

## Security Rules

- **Never remove or weaken** the security headers in `netlify.toml`
- **CORS** on functions is locked to `https://www.mgcglobalconsulting.com` — do not open to `*`
- **Stripe price IDs** must always be validated against the server-side allowlist in `create-checkout.js`
- **Anon key only** in `dashboard.html` — never embed the Supabase service role key in client code
- **`.env.local` is gitignored** — never commit secrets

---

## Key Conventions

- **Static HTML only** — no React, no Vue, no build pipeline on the frontend
- **CSS custom properties** for all colors and typography — never hardcode hex values in HTML `style` attributes
- **Raleway** is the display/heading font — do not substitute
- **All nav links** must appear on every page with consistent structure
- **Scroll progress bar** (`#scrollProgress`) must remain on every page
- **`mgc-logo-transparent.png`** is the correct logo — circular, drop-shadow, no white background
- **Supabase tables** are prefixed `mgc_` to avoid collision with other projects on the same instance
- **Functions use `Promise.allSettled`** — failures in one downstream service must never block the webhook response

---

## Local Development

```bash
# Serve static files
python3 -m http.server 3456

# Or use Netlify CLI for full function support
npx netlify dev

# Test a function directly
curl -X POST http://localhost:8888/.netlify/functions/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_xxx","mode":"payment"}'
```
