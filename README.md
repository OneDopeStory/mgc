<<<<<<< HEAD
# MGC Global Consulting — Site README

Enterprise-caliber AI strategy, automation, CRM optimization, and operational systems design for growth-stage businesses.

**Source of truth:** [`CLAUDE.md`](./CLAUDE.md) is the canonical project memory for deployment state, integration behavior, and assistant-facing conventions. This README is a quick-start mirror.

**Live site:** https://www.mgcglobalconsulting.com
**Hosting:** Netlify (static HTML + serverless functions)
**Stack:** Vanilla HTML/CSS/JS · Netlify Functions · Supabase · Stripe

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Netlify functions runtime |
| npm | 9+ | Package management |
| Netlify CLI | latest | Local dev + deployment |
| Git | any | Version control |

Install Netlify CLI:
```bash
npm install -g netlify-cli
```

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd mgc-site-complete_1
npm install
```

### 2. Configure environment variables

Copy the template and fill in your real values:

```bash
cp .env.template .env.local
```

Open `.env.local` and add all required keys (see **Environment Variables** section below). Never commit `.env.local`.

### 3. Start the dev server

**Option A — Full function support (recommended):**
```bash
npx netlify dev
```
This serves the site at `http://localhost:8888` with all Netlify Functions running locally.

**Option B — Static only (no functions):**
```bash
python3 -m http.server 3456
```
Serves at `http://localhost:3456`. Functions will not work in this mode.

### 4. Test a function directly

```bash
curl -X POST http://localhost:8888/.netlify/functions/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_xxx","mode":"payment"}'
```

---

## Project Structure

```
mgc-site-complete_1/
│
├── index.html                  # Homepage
├── dashboard.html              # Client portal (Supabase auth)
├── services.html               # Solutions gallery
├── membership.html             # Membership tiers
├── membership-v2.html          # Alternate membership layout
├── checkout.html               # Stripe checkout handler
├── thank-you.html              # Post-payment confirmation
├── success.html                # Order success page
├── ai-consulting.html          # Service detail
├── ai-workshops.html           # Service detail
├── automation.html             # Service detail
├── crm-optimization.html       # Service detail
├── systems-design.html         # Service detail
├── retainer-support.html       # Service detail
├── partner-success.html        # Partnership confirmation
├── 403.html / 404.html / 500.html
│
├── assets/
│   ├── images/                 # All site images (see DESIGN.md for inventory)
│   └── video/                  # globe-connected.mp4, m-one-shot.mp4
│
├── netlify/
│   └── functions/
│       ├── create-checkout.js  # Stripe checkout session creator
│       ├── payment-webhook.js  # Stripe webhook → Notion CRM sync
│       ├── lead-intake.js      # Booking form submissions → Notion CRM lead/deal
│       ├── new-client-signup.js # Supabase profile inserts → Notion CRM lead/deal
│       └── request-invoice.js  # Custom invoice request handler
│
├── netlify.toml                # Build config, headers, redirects
├── package.json                # stripe@^17.7.0
├── .env.template               # Required env var reference
├── hs-breeze-bridge.js         # HubSpot Breeze integration
├── robots.txt
├── sitemap.xml
└── schema.jsonld               # JSON-LD structured data
```

---

## Deployment

### Current production status

As of 2026-06-04, the Netlify production site has already been updated with the current portal/Supabase changes. The next commit should serve as the source-control record of the state now live at `https://www.mgcglobalconsulting.com`.

### Auto-deploy (recommended)

Push to the `main` branch and Netlify deploys automatically:

```bash
git add .
git commit -m "your message"
git push origin main
```

### Manual deploy via CLI

```bash
# Preview deploy
npx netlify deploy --dir .

# Production deploy
npx netlify deploy --prod --dir .
```

**No build step required.** Netlify serves the root directory directly. Functions are bundled automatically by esbuild on deploy.

---

## Environment Variables

Set these in the Netlify dashboard under **Site Settings → Environment Variables**, or in `.env.local` for local dev.

### Stripe

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_MEMBERSHIP_STARTER` | Starter tier price ID |
| `STRIPE_PRICE_MEMBERSHIP_PRO` | Pro tier price ID |
| `STRIPE_PRICE_MEMBERSHIP_ELITE` | Elite tier price ID |
| `STRIPE_PRICE_AI_STRATEGY_SESSION` | One-time service price ID |
| `STRIPE_PRICE_AI_WORKSHOP` | Workshop price ID |
| `STRIPE_PRICE_AUTOMATION_AUDIT` | Automation audit price ID |
| `STRIPE_PRICE_CRM_BUILDOUT` | CRM buildout price ID |
| `STRIPE_PRICE_SYSTEMS_DESIGN` | Systems design price ID |

### QuickBooks (OAuth 2.0)

| Variable | Description |
|---|---|
| `QB_CLIENT_ID` | QuickBooks app client ID |
| `QB_CLIENT_SECRET` | QuickBooks app client secret |
| `QB_REFRESH_TOKEN` | OAuth refresh token (long-lived) |
| `QB_REALM_ID` | QuickBooks company/realm ID |

### Google Sheets

| Variable | Description |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_SERVICE_ACCOUNT_KEY_B64` | Service account JSON key, base64-encoded |

### Slack

| Variable | Description |
|---|---|
| `SLACK_PAYMENTS_WEBHOOK` | Incoming webhook URL for invoice request alerts |

### Twilio

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Sender number in E.164 format (`whatsapp:+1...`) |

### Notion

| Variable | Description |
|---|---|
| `NOTION_API_KEY` | Notion integration secret |
| `NOTION_COMPANIES_DATABASE_ID` | Companies database ID |
| `NOTION_CONTACTS_DATABASE_ID` | Contacts database ID |
| `NOTION_DEALS_DATABASE_ID` | Deals database ID |
| `NOTION_PROJECTS_DATABASE_ID` | Projects database ID |
| `NOTION_INVOICES_DATABASE_ID` | Invoices database ID |
| `SUPABASE_WEBHOOK_SECRET` | Bearer token for Supabase database webhooks hitting Netlify functions |

### Site

| Variable | Description |
|---|---|
| `SITE_URL` | `https://www.mgcglobalconsulting.com` |

---

## Netlify Functions Reference

### `POST /.netlify/functions/create-checkout`

Creates a Stripe Checkout Session and returns a redirect URL.

**Request body:**
```json
{
  "priceId": "price_xxx",
  "mode": "payment",
  "customerEmail": "client@example.com",
  "metadata": {}
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

- `mode`: `"payment"` (one-time) or `"subscription"` (membership)
- Price IDs are validated against a server-side allowlist — never pass arbitrary IDs

---

### `POST /.netlify/functions/payment-webhook`

Handles `checkout.session.completed` Stripe events. Verifies the Stripe signature, then syncs the payment to Notion CRM:

1. **Find or create Company** — matched from customer name
2. **Find or create Contact** — matched by email, status updated to Active
3. **Create Invoice** — status Paid, linked to Company, includes Stripe payment intent ID
4. **Close or create Deal** — Lead deals move to Closed Won, or a new Closed Won deal is created

Notion write failures are logged but do not block the webhook success response.

---

### `POST /.netlify/functions/lead-intake`

Handles booking form submissions from the site.

**Request body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "company": "Acme Corp",
  "service": "AI Consulting & Strategy",
  "message": "Interested in an assessment",
  "requested_date": "2026-06-10"
}
```

Writes to Notion CRM: Company, Contact, and a new Lead-stage Deal. CRM write failures are non-blocking for the form UX.

---

### `POST /.netlify/functions/new-client-signup`

Handles Supabase database webhooks for `mgc_client_profiles` inserts.

**Trigger:** Supabase Dashboard → Database Webhooks → `mgc_client_profiles` `INSERT`

**Auth:** `Authorization: Bearer {SUPABASE_WEBHOOK_SECRET}`

Writes to Notion CRM: Company, Contact, and a Portal Signup Lead Deal. Notion failures return `200` so Supabase does not retry indefinitely.

---

### `POST /.netlify/functions/request-invoice`

Handles custom invoice requests from the site.

**Request body:**
```json
{
  "service": "AI Strategy Session",
  "amount": 2500,
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "company": "Acme Corp",
  "note": "2-hour deep dive"
}
```

Fans out to: Slack (notify team) + QuickBooks (create draft invoice, due in 7 days).

---

## Client Portal (dashboard.html)

Protected by Supabase auth. Users can sign in with email/password or Google OAuth.

**Supabase project:** `bjnpibxaxlgvlzeegwnm.supabase.co`
**Live Netlify update:** dashboard/admin now use the Supabase publishable key and redirect Google OAuth to `https://www.mgcglobalconsulting.com/dashboard`.

Portal panels:
- **Overview** — KPI cards and recent activity feed
- **Projects** — Active engagements with phase/progress tracking
- **Deliverables** — Downloadable files and assets
- **Invoices** — Billing history and payment status
- **Schedule** — Calendar view + session booking form
- **Settings** — Profile, contact info, notification preferences

The anon key is embedded in `dashboard.html` — this is intentional and safe. Never embed the Supabase service role key in client-side code.

---

## Integrations

| Service | Purpose | Docs |
|---|---|---|
| Stripe | Payments & subscriptions | stripe.com/docs |
| Supabase | Auth + client portal database | supabase.com/docs |
| QuickBooks | Custom invoice creation | developer.intuit.com |
| Slack | Invoice request alerts | api.slack.com |
| Notion | CRM + client records | developers.notion.com |
| HubSpot | Lead capture forms + Breeze AI | developers.hubspot.com |

---

## Security Notes

- CORS on Netlify Functions is locked to `https://www.mgcglobalconsulting.com`
- Security headers (HSTS, X-Frame-Options, CSP) are set in `netlify.toml` — do not remove them
- Stripe price IDs are validated server-side against an allowlist in `create-checkout.js`
- Never embed the Supabase service role key in any HTML or JS file

---

## HubSpot Integration

`hs-breeze-bridge.js` loads HubSpot's tracking code and Breeze AI agent for Portal ID `245294674`. It is included on every page just before `</body>`.

---

## Key Conventions

- **No build step** — edit HTML/CSS/JS directly, commit, and deploy
- **CSS custom properties** for all colors and spacing — never hardcode hex values
- **Raleway** is the display/heading font — do not substitute
- All nav links must appear on every page with consistent structure
- Scroll progress bar (`#scrollBar`) must remain on every page
- `mgc-logo-transparent.png` is the correct logo — circular with drop-shadow, no white fill
# loyaltysocial
=======
# mgc-site-complete_1-update
full-site-vs-code-claude-codex
>>>>>>> 8280ee4c65f02452638a9feaac64ace9a07da833
