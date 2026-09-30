# CLAUDE.md — MGC Global Consulting

This file provides essential context for AI coding assistants working on this codebase.
Read this before making any changes.

> **Source of truth:** `CLAUDE.md` is the canonical project memory for deployment state, integration behavior, and assistant-facing conventions. Other docs may summarize or mirror this file, but resolve conflicts in favor of `CLAUDE.md`.

> **Design system reference:** See [`BRANDING.md`](./BRANDING.md) for the complete font stack, color tokens, spacing scale, header/nav spec, hero layout, button styles, card styles, and animation system. All visual decisions must reference that file.

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
| Auth & Database | Supabase (`https://bjnpibxaxlgvlzeegwnm.supabase.co`) |
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
│       ├── payment-webhook.js  # POST — Stripe webhook → Notion CRM fan-out
│       ├── lead-intake.js      # POST — Booking form submissions
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
Writes to **Notion CRM only** (QuickBooks, Sheets, Slack, WhatsApp removed 2026-06-02):
1. **Find or create Company** — matched by customer name
2. **Find or create Contact** — matched by email, updates status → Active
3. **Create Invoice** — paid, linked to Company, includes Stripe payment intent ID

### `POST /.netlify/functions/lead-intake`
Handles booking form submissions from `index.html`.
**Body:** `{ name, email, company, service, message, requested_date, source }`
Writes lead to Notion CRM (Contacts + Deals pipeline).

### `POST /.netlify/functions/request-invoice`
Handles custom invoice requests.
**Body:** `{ service, amount, customer_name, customer_email, company?, note? }`
Fans out to: Slack (notify) + QuickBooks (create draft invoice, due 7 days)

---

## Supabase Schema (Client Portal)

**Project:** `bjnpibxaxlgvlzeegwnm.supabase.co`

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
| **Supabase** | Portal auth + database | Credentials in `dashboard.html` (anon key only); Vercel integration config ID `icfg_2KqYImfTxvpGfwS5OfySC1yP` on team `mgcglobalconsultings-projects` auto-injects env vars to Vercel deployment |
| **Notion** | CRM — Companies, Contacts, Deals, Projects, Invoices | See Notion CRM section below |
| **HubSpot** | Forms + Breeze AI agent | Portal ID `245294674` in `hs-breeze-bridge.js` |

---

## Stripe Workflows Reference

**Source:** https://docs.stripe.com/workflows
**Research date:** 2026-06-03
**Status:** Public preview. Re-check official Stripe docs before using Workflows for a production migration.

Stripe Workflows is Stripe's Dashboard-based visual builder for no-code, multi-step Stripe automations. It can react to Stripe events or be invoked on demand through Stripe's API, and is useful for payment/customer/subscription routing, metadata updates, internal finance notifications, and operational rules. For this repo, treat Workflows as an optional Stripe-side automation layer. Do **not** replace `netlify/functions/payment-webhook.js` or the server-side Checkout allowlist unless that migration is explicitly requested and tested.

This is Stripe Workflows, not the separate Workflow SDK reference later in this file.

### Core model

- A workflow has exactly one trigger plus ordered steps.
- Trigger type is either event-based or programmatic, not both. If both are needed, create separate workflows.
- Steps are actions or conditions. Each workflow supports up to 12 steps.
- Trigger conditions filter whether a workflow starts and do not count as steps.
- Conditions can stop a workflow successfully or branch into multiple paths. Only actions inside branches count as steps.
- Loops iterate over Stripe object collections. The loop itself does not count as a step; actions inside the loop count once per iteration.
- Multiple workflows with the same trigger run independently.
- Common MGC-relevant triggers: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.payment_failed`, `customer.created`, `customer.updated`, async Checkout success/failure events, and Radar early fraud warning events.
- Actions run against the latest object state at execution time. Dynamic references use the state from the trigger or the most recent retrieve/list step, so add retrieve actions before conditions when current invoice/subscription/customer data matters.
- Built-in unique action: `Email a team member`.
- Workflows support most Stripe v1/v2 events and API actions; unsupported ones simply do not appear in the Dashboard.

### Limits, lifecycle, and debugging

- Stripe allows up to 50 active workflows and 50 total active + inactive workflows.
- Trigger list conditions evaluate only the first 100 items in a list field.
- Use Stripe Sandboxes for workflow tests before live use.
- Use Dashboard Recent runs / Run history for step-by-step inspection.
- Workbench is available for trigger events and API action request logs, but not Workflows-only steps such as team email or condition evaluation.
- Stripe saves a numbered version each time a workflow is activated. Add version descriptions when changing production workflows.
- Draft mode allows editing an active workflow without changing the live version until activation.
- Built-in reliability features include recursion detection, automatic retries, idempotency, run status, and run details. Still design any external side effects to be idempotent.

### Programmatic triggers

- Use programmatic triggers when a human or backend needs to invoke Stripe logic on demand.
- Invoke endpoint: `POST https://api.stripe.com/v2/extend/workflows/{id}/invoke` with `input_parameters`.
- Only active workflows with a manual/on-demand trigger can be invoked through the API.
- The API returns immediately after accepting the run. Track completion by retrieving `GET /v2/extend/workflow_runs/{id}` or listening for `v2.extend.workflow_run.started`, `v2.extend.workflow_run.succeeded`, and `v2.extend.workflow_run.failed` webhook events.
- Always send an `Idempotency-Key` for backend-initiated invoke calls.
- Limitations: no scheduled/recurring triggers, no generic webhook ingestion, no synchronous wait-for-completion mode, no direct third-party event triggers, and event-triggered workflows cannot be API-invoked. Bridge external events through a trusted backend if needed.

### Loops

- Loops pair list actions, such as list customers/subscriptions/invoices/charges/payment intents, with follow-up actions that reference each list item.
- Items process sequentially in API return order.
- Pagination is handled page by page during execution; items created after the list action starts are not included.
- Loops fail fast: if an action fails for one item, later items are not processed.
- Keep list filters tight because runtime/action usage scales with `items * actions_per_item`.

### Custom actions and external systems

- Custom actions come from installed Stripe Apps or from a Stripe App extension using `extend.workflows.custom_action`.
- Implementation options: TypeScript script on Stripe managed runtime, or remote function on MGC-controlled HTTP infrastructure.
- Required permission for custom actions: `workflow_custom_action_run_write`.
- Required method: `execute`. Optional method: `get_form_state` for dynamic Dashboard configuration.
- Each `execute` call has a 20-second timeout. Stripe retries transient failures.
- For remote functions, return 4xx for permanent failures and 5xx for transient failures.
- Use the Stripe request `id` as the idempotency key for custom action side effects.
- For MGC, keep Notion/Supabase/QuickBooks writes in Netlify functions unless a task explicitly asks for a Stripe App custom action.

### MGC fit ideas

- High-value purchase alert: `payment_intent.succeeded` with amount/currency trigger conditions -> `Email a team member`.
- VIP customer tagging: payments over threshold -> update Customer metadata such as `Tier=VIP`.
- Failed payment triage: `payment_intent.payment_failed` or `invoice.payment_failed` -> branch by amount/error code -> notify ops or update customer metadata.
- Subscription maintenance: programmatic trigger with `customer_id`, `tag_key`, `tag_value` -> list active subscriptions -> loop and update metadata.
- Fraud handling: early fraud warning -> retrieve charge -> branch by amount versus dispute fee -> refund low-value charges or email team for review.
- External CRM/task updates: use a Marketplace app, a custom action, or a trusted backend bridge. Never expose service-role credentials or third-party secrets in client-side code.

---

## Notion CRM

**Integration name:** MGC Global Consulting
**Parent page:** MGC CRM PAGE (ID stored in `NOTION_PARENT_PAGE_ID`)
**Set up:** 2026-06-02

### Databases

| Database | Env Var | Purpose |
|---|---|---|
| Companies | `NOTION_COMPANIES_DATABASE_ID` | Accounts — industry, revenue, status |
| Contacts | `NOTION_CONTACTS_DATABASE_ID` | People — email, phone, source, follow-up dates |
| Deals | `NOTION_DEALS_DATABASE_ID` | Pipeline — stage, value, service type, close dates |
| Projects | `NOTION_PROJECTS_DATABASE_ID` | Delivery — status, progress %, budget vs spent |
| Invoices | `NOTION_INVOICES_DATABASE_ID` | Billing — linked to Stripe payment intent IDs |

### Webhook behavior (payment-webhook.js)
On `checkout.session.completed`:
1. Find or create **Company** (by customer name)
2. Find or create **Contact** (by email) → status set to Active
3. Create **Invoice** → status Paid, Stripe payment intent ID stored

### Notion API version in use: `2022-06-28`

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
| `SLACK_PAYMENTS_WEBHOOK` | Slack incoming webhook URL for invoice request alerts |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio credentials |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender number |
| `NOTION_API_KEY` | Notion integration secret |
| `NOTION_CLIENTS_DATABASE_ID` | Notion clients database ID |
| `NOTION_PARENT_PAGE_ID` | Notion CRM parent page ID |
| `NOTION_COMPANIES_DATABASE_ID` | Notion Companies database |
| `NOTION_CONTACTS_DATABASE_ID` | Notion Contacts database |
| `NOTION_DEALS_DATABASE_ID` | Notion Deals database |
| `NOTION_PROJECTS_DATABASE_ID` | Notion Projects database |
| `NOTION_INVOICES_DATABASE_ID` | Notion Invoices database |
| `SUPABASE_WEBHOOK_SECRET` | Bearer token for Supabase database webhooks hitting Netlify functions |
| `SITE_URL` | `https://www.mgcglobalconsulting.com` |

---

## Deployment

**No build step.** Netlify serves the root directory directly.

**Current production status:** As of 2026-06-04, the Netlify production site has already been updated with the current Supabase portal changes: `bjnpibxaxlgvlzeegwnm.supabase.co`, the Supabase publishable key, the `www` Google OAuth dashboard redirect, rerunnable portal schema SQL, and the new Supabase-to-Notion signup webhook. Treat the next commit as the source-control record of the live Netlify state.

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
- **Notion database IDs must never be hard-coded** in CLAUDE.md or any committed file — Netlify's secret scanner will block the build. Always reference via env vars (see Environment Variables table)

---

## Key Conventions

- **Static HTML only** — no React, no Vue, no build pipeline on the frontend
- **CSS custom properties** for all colors and typography — never hardcode hex values in HTML `style` attributes
- **Raleway** is the display/heading font — do not substitute
- **All nav links** must appear on every page with consistent structure
- **Scroll progress bar** (`#scrollProgress`) must remain on every page
- **`mgc-logo-transparent.png`** is the correct logo — located at `assets/mgc-logo-transparent.png` (root-level assets folder). The actual MGC logo (chrome globe + M letterform) was installed 2026-04-06. Do NOT use `assets/images/` path — that subdirectory does not exist.
- **No emojis anywhere** — all emoji replaced with custom inline SVGs. Bot responses in JS also stripped of emojis. Chatbot quick-links use SVG icons.
- **Color palette is unified** — all pages must use the index.html root variables: `--abyss:#010C1A`, `--cyan:#00D4FF`, `--gold:#FFB347`. membership.html was synced 2026-04-06.
- **Hero body text**: `line-height:2.0; letter-spacing:0.015em` for readability
- **Membership tier icons**: custom SVG icons (seedling for Starter, bolt for Pro, crown for Elite) with hover scale + tilt animation via `.tier-card:hover .tier-icon`
- **Supabase tables** are prefixed `mgc_` to avoid collision with other projects on the same instance
- **Functions use `Promise.allSettled`** — failures in one downstream service must never block the webhook response

---

## Vercel Dev Workflow Reference

**Source:** https://vercel.com/resources/iterate-faster-with-a-streamlined-development-workflow
*(Saved 2026-06-02 — applies to any future Vercel migration or DX improvements)*

### 4 Pillars of a Streamlined Workflow
1. **More time for innovation** — remove config/infra overhead from devs
2. **Consistent SLAs** — reliable deploys via global CDN / Fluid Compute
3. **Collaborative feedback** — Preview Deployments with inline commenting (replaces siloed design/copy/code review tools)
4. **Code health at scale** — Conformance (auto static analysis) + Code Owners (review gates)

### Key Vercel Features
| Feature | Purpose |
|---|---|
| Preview Deployments | Shareable PR preview URL on production-grade infra; zero staging setup |
| Commenting on Previews | Inline feedback directly on components/layouts |
| Conformance | Automated code health checks baked into CI |
| Code Owners | Assign ownership, enforce review gates as team grows |
| CI/CD (DX Platform) | Ships teams 6× faster |
| Fluid Compute | Node.js serverless, no cold-start penalty |

### Good DX = tooling devs love + infrastructure that removes tech debt

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

---

## Workflow SDK API Reference

**Source:** https://workflow-sdk.dev/docs/api-reference
**Version:** v4 (latest) *(saved 2026-06-02)*

Vercel's durable workflow execution SDK. Supports Next.js, Astro, Express, Fastify, Hono, Nuxt, SvelteKit, TanStack Start, Vite, and Python (beta).

---

### Packages Overview

| Package | Purpose |
|---|---|
| `workflow` | Core primitives — steps, streaming, webhooks, error handling |
| `workflow/api` | Runtime functions — start runs, inspect status, resume |
| `workflow/next` | Next.js integration — auto-configures bundling |
| `workflow/errors` | Semantic error types for storage backend failures |
| `@workflow/serde` | Custom class serialization symbols |
| `@workflow/ai` | AI SDK helpers for AI-powered workflows |
| `@workflow/vitest` | Vitest plugin + test helpers for in-process integration testing |

---

### Workflow Globals

Inside `"use workflow"` functions, the environment is **restricted** to enforce determinism across replays.

#### Deterministic APIs (safe to use — seeded/fixed per run)

| API | Behavior |
|---|---|
| `Math.random()` | Seeded RNG — same seed → same sequence every replay |
| `Date` / `Date.now()` / `new Date()` | Fixed timestamp advancing with logical clock |
| `crypto.getRandomValues()` | Seeded — deterministic per run |
| `crypto.randomUUID()` | Seeded — deterministic UUIDs per run |
| `crypto.subtle.digest()` | Real implementation (SHA-256 etc. are deterministic) |

#### Web Platform APIs Available
Standard Web APIs (URL, Headers, Request, Response, TextEncoder, etc.) are available.
Binary: use `Uint8Array` with `.toBase64()` / `.fromBase64()` / `.toHex()` / `.fromHex()`, or `atob()` / `btoa()`.

#### NOT Available in Workflow Functions
Move these to **step functions** instead:
- **Node.js core modules**: `fs`, `path`, `http`, `https`, `net`, `dns`, `child_process`, `os`, `stream`, `crypto` (Node version), etc.
- **`fetch`**: Use `import { fetch } from "workflow"` instead → see [fetch-in-workflow error](https://workflow-sdk.dev/docs/errors/fetch-in-workflow)
- **Timers**: `setTimeout`, `setInterval`, `setImmediate` → use `sleep()` instead → see [timeout-in-workflow error](https://workflow-sdk.dev/docs/errors/timeout-in-workflow)
- **`Buffer`**: Use `Uint8Array` + encoding helpers

---

### `workflow` — Core Primitives

```ts
import { sleep, fetch, createHook, defineHook, createWebhook, getStepMetadata } from "workflow";
```

| Function | Description |
|---|---|
| `sleep(duration)` | Suspend workflow for a duration; use instead of `setTimeout` |
| `fetch(url, init?)` | HTTP requests from within workflow functions |
| `createHook(token, payload?)` | Create a hook that suspends workflow until resumed |
| `defineHook(schema)` | Type-safe hook helper for consistent payload types |
| `createWebhook(options?)` | Suspend workflow until an HTTP request is received |
| `getStepMetadata()` | Returns context about the current step execution |

---

### `workflow/api` — Runtime Functions

```ts
import { start, getRun, resumeHook, resumeWebhook } from "workflow/api";
```

| Function | Description |
|---|---|
| `start(workflow, args)` | Start a workflow run; returns `Run<T>` |
| `getRun(runId)` | Get run status/metadata without waiting; returns run object with `.wakeUp()` |
| `resumeHook(token, payload)` | Resume a suspended workflow by sending payload to a hook |
| `resumeWebhook(request)` | Resume a workflow by sending a `Request` to a webhook |

**`getRun(runId).wakeUp({ correlationIds })`** — Wake up a sleeping workflow targeting specific sleep correlation IDs.

---

### `workflow/next` — Next.js Integration

```ts
// next.config.ts
import { withWorkflow } from "workflow/next";
export default withWorkflow(nextConfig);
```

| Export | Description |
|---|---|
| `withWorkflow(config)` | Wraps `next.config` — configures webpack/turbopack loaders for `"use step"` / `"use workflow"` directives |

---

### `@workflow/serde` — Serialization

```ts
import { WORKFLOW_SERIALIZE, WORKFLOW_DESERIALIZE } from "@workflow/serde";

class MyClass {
  [WORKFLOW_SERIALIZE]() { return { ...this }; }
  static [WORKFLOW_DESERIALIZE](data) { return Object.assign(new MyClass(), data); }
}
```

| Symbol | Description |
|---|---|
| `WORKFLOW_SERIALIZE` | Define how to serialize a class instance to plain data |
| `WORKFLOW_DESERIALIZE` | Define how to reconstruct a class instance from plain data |

---

### `@workflow/ai` — AI SDK Helpers

Helpers for integrating Vercel AI SDK into durable workflows. Enables `streamText`, `generateText`, and tool calls inside workflow steps with full durability and observability.

```ts
import { ... } from "@workflow/ai";
```

Full class/function list: https://workflow-sdk.dev/docs/api-reference/workflow-ai

---

### `@workflow/vitest` — Testing

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { workflow } from "@workflow/vitest";

export default defineConfig({
  plugins: [workflow()],  // handles SWC transforms, bundle build, in-process registration
});
```

#### Plugin

| Export | Description |
|---|---|
| `workflow(options?)` | Returns `Plugin[]` — full setup: SWC transforms + bundle build + handler registration |
| `buildWorkflowTests(options?)` | Manually build workflow/step bundles to disk (called by plugin in `globalSetup`) |

#### Test Helpers

| Function | Signature | Description |
|---|---|---|
| `waitForSleep(run, options?)` | `Promise<string>` | Polls until pending `sleep()` — returns correlation ID for `.wakeUp()` |
| `waitForHook(run, options?)` | `Promise<Hook>` | Polls until pending hook matching optional `token` filter |

```ts
// waitForSleep example
const run = await start(myWorkflow, []);
const sleepId = await waitForSleep(run);
await getRun(run.runId).wakeUp({ correlationIds: [sleepId] });

// waitForHook example
const run = await start(myWorkflow, ["doc-1"]);
const hook = await waitForHook(run, { token: "approval:doc-1" });
await resumeHook(hook.token, { approved: true });
```

#### `WorkflowTestOptions`

| Option | Description |
|---|---|
| `cwd?` | Working directory (for monorepos where `workflows/` isn't at config root) |
| `rootDir?` | Output location for `.workflow-data` / `.workflow-vitest` artifacts |

---

### Key Patterns

**Directives:**
- `"use workflow"` — marks a function as a durable workflow (restricted env)
- `"use step"` — marks a function as a step (full Node.js runtime access)

**Never use Node.js APIs or `fetch` directly in `"use workflow"` functions.** Use the `workflow` package's `fetch()` and `sleep()` wrappers instead.

**Steps have full Node.js access** — move all I/O, `fs`, `http`, timers, etc. into step functions.

**Docs:** https://workflow-sdk.dev/docs/api-reference

---

## MGC Global Consulting LLC - AI Growth Log
**Last Updated:** 2026-06-04 (Session 2)

### Current Project State
- **Infrastructure:** Supabase Free Nano (us-east-1)
- **Authentication:** Google OAuth configured for the Netlify production dashboard redirect.
- **Frontend Deployment:** Netlify production live at `https://www.mgcglobalconsulting.com`
- **Onboarding Assistant:** `onboarding-assistant.html` built and live at `/onboarding-assistant`

### Completed Increments
- [x] Initial Stack Definition (Supabase + Obsidian + Claude via MCP)
- [x] Whitelisted production redirect URL (`/dashboard`) in Supabase URL Configuration.
- [x] Updated dashboard/admin Supabase project reference to `bjnpibxaxlgvlzeegwnm.supabase.co`.
- [x] Updated Google OAuth redirect to `https://www.mgcglobalconsulting.com/dashboard`.
- [x] Added rerunnable portal schema SQL and profile email migration notes.
- [x] Added Supabase profile signup webhook flow into Netlify/Notion CRM.
- [x] Confirmed the current files were already updated on Netlify production.
- [x] **AI Operations Front Door — Sprint 1 (2026-06-04)**
  - Created `onboarding-assistant.html` — 4-step rule-based wizard (visitor type, readiness score, intake form, confirmation)
  - 8 visitor type cards route to correct sub-agent (New Client, Referral Partner, Existing Client, Automation, CRM/Notion, AI Training, Billing, General)
  - 10-question Operations Readiness Score with 4 scoring categories (0–30/31–60/61–80/81–100)
  - Intake form submits full payload to `/.netlify/functions/lead-intake` → Notion CRM
  - Step 4 confirmation shows score, category, recommended next step, and what-happens-next copy
  - Extended `netlify/functions/lead-intake.js` to accept and log: visitor_type, assigned_sub_agent, readiness_score, readiness_category, recommended_next_step, challenge, timeline, budget_range
  - Added `/onboarding-assistant` redirect in `netlify.toml`

### Next Incremental Milestones
- [ ] Test the live Google OAuth login flow on the Netlify production deployment
- [ ] Sprint 2 — Add Slack webhook alerts to onboarding-assistant submissions (per visitor type → correct channel)
- [ ] Sprint 3 — Add "Choose Your Path" section + "Start With MGC Assistant" CTA to `index.html` homepage
- [ ] Sprint 4 — Sandbox QuickBooks integration for billing visitor type
- [ ] Sprint 5 — Dashboard Redesign (see full plan below)

### Context Memory Cache
The AI Operations Front Door (onboarding-assistant.html) is the primary new feature. It is wired to the existing Notion CRM via lead-intake.js. The visitor type → sub-agent routing, readiness scoring, and form submission are fully functional. Slack webhooks and homepage CTAs are scoped for Sprint 2–3. Commit the current state before deploying to Netlify production.

### Website Audit (added 2026-09-30)
Business facts, the latest audit, and reusable audit instructions live in `.mgc-audit/` (dot-folder — Netlify does not publish dot-paths). Load them only when auditing. Trigger: "Read MGC_BUSINESS_CONTEXT.md and MGC_SITE_AUDIT_PROMPT.md, then run the MGC website audit." Note: the 2026-09-30 audit found that live production differs from some statements in this file (canonical host, Supabase project on live dashboard) — see `.mgc-audit/MGC_WEBSITE_AUDIT.md` F-10/F-12.

---

## Dashboard Redesign Plan — Sprint 5
**Inspiration:** Dribbble "Dashboard Design Overview Analysis" — card-grid layout, rich data viz, engagement timeline, glassmorphism panels, bold KPI typography
**Reference:** https://dribbble.com/shots/25849429-Dashboard-Design-Overview-Analysis
**File to modify:** `dashboard.html` (single-file static HTML — no build step)
**Scope:** Owner portal (you) + client onboarding experience
**Status:** PLANNED — execute next session

---

### Design Direction

Elevate the current dark dashboard to a premium "Overview Analysis" aesthetic:
- **Layout:** CSS Grid — left sidebar (265px fixed) + main content area with a 3-zone layout (top KPIs → mid charts row → bottom activity/lists)
- **Cards:** Deeper glassmorphism — `backdrop-filter: blur(32px)`, gradient borders using `conic-gradient`, `box-shadow` with colored glow layers
- **Typography:** Raleway 900 for KPI numbers (3.5rem+), Plus Jakarta Sans for body, JetBrains Mono for data values
- **Color additions:** Add `--emerald:#10B981` for positive deltas, `--rose:#F43F5E` for alerts — keep existing `--abyss`, `--cyan`, `--gold`
- **Charts:** Pure CSS/SVG — no external chart libraries (keeps zero build step). Use SVG `<polyline>` for sparklines, `<circle>` stroke-dashoffset for donut rings, `<rect>` for bar charts
- **Animations:** Staggered counter animation on KPI numbers (JS `requestAnimationFrame`), fade-up on panel switch, pulse dot on live status indicators

---

### Panel-by-Panel Redesign

#### 1. Overview Panel (complete redesign)
Current: 4 flat KPI tiles + 2 cards + deliverables list
New layout:

```
[ Engagement Score ]  [ Automations Live ]  [ Hours Saved ]  [ Account Balance ]
     donut ring             counter+spark        counter+bar       gold gradient

[ Active Projects — timeline bar ]     [ Activity Feed — live ticker ]
[ Pending Deliverables — status rows ] [ Next Session countdown card ]
```

**Engagement Score card:** SVG donut ring (0–100), color shifts cyan→gold→emerald based on value. Pulls from `mgc_projects` progress_pct average.
**Automations Live:** Animated counter, sparkline of last 30 days (hardcoded array for now, Supabase-driven later).
**Hours Saved:** Calculated as `projects.count * 23` (MGC brand stat). Progress bar vs. monthly target.
**Next Session countdown:** Live JS timer to next `mgc_bookings` confirmed date. Shows "No session scheduled" with Book CTA if empty.

#### 2. Projects Panel (enhanced)
Current: Grid of skeleton cards
New: Timeline view toggle (grid ↔ timeline)

- **Grid view:** Each project card has: status badge, service type icon, phase label, `<progress>` bar with animated fill, last-updated timestamp, "View Details" expand
- **Timeline view:** Horizontal Gantt-style bars using CSS Grid + `grid-column: start / end` mapped to project dates. Color-coded by service type (AI=cyan, CRM=gold, Automation=emerald, Systems=blue)
- **Empty state:** Branded illustration + "Your first project will appear here once your engagement kicks off" + Schedule CTA

#### 3. New Panel — Onboarding Checklist (for new clients)
**Trigger:** Show prominently if `mgc_client_profiles.membership_tier` is null or `created_at` < 7 days ago
**Nav label:** "Get Started" with a gold pill badge showing incomplete count
**Steps:**
1. Complete your profile (name, company, phone) — links to Settings
2. Schedule your kickoff call — links to Schedule panel
3. Review your engagement agreement — PDF link (Supabase Storage)
4. Connect your tools (Notion / HubSpot / Zapier) — links to integrations guide
5. Meet your dedicated strategist — TrueAssist intro prompt

Each step: checkbox visual, completion state stored in `localStorage` (upgrade to Supabase later), progress ring at top of panel.

#### 4. New Panel — ROI Dashboard
**Nav label:** "ROI & Impact"
**Who sees it:** All tiers (data depth increases by tier)

Metrics displayed:
| Metric | Source | Visualization |
|---|---|---|
| Hours reclaimed | `projects.count * 23` | Counter + area sparkline |
| Automations deployed | `mgc_projects` count where service_type='Automation' | Counter |
| Cost avoidance estimate | hours * $85/hr (avg ops cost) | Gold dollar counter |
| Engagement health | avg(progress_pct) across active projects | Donut ring, color-coded |
| Deliverables completed | `mgc_deliverables` where status='complete' | Bar chart |
| Days since engagement start | `mgc_client_profiles.created_at` | Timeline pill |

All counters animate from 0 on first render using `requestAnimationFrame` + easing function.

#### 5. Schedule Panel (enhanced)
Current: Calendar grid + request form + upcoming bookings
New additions:
- **Session type icons** — each session type has a distinct SVG icon
- **Confirmed session card** — if a booking exists with status='confirmed', show a prominent card at top with countdown timer (days:hours:mins)
- **Calendar highlight** — booked dates show a cyan dot, today shows gold ring
- **Form improvement** — add "Estimated Duration" auto-fill based on session type selection, "Agenda items" multi-select checklist (Strategy Review / Deliverable Feedback / New Initiative / Technical Issue / Other)

#### 6. Settings Panel (enhanced)
Current: Profile form + notification toggles + tier card
New additions:
- **Profile avatar upload** — click avatar circle → file input → upload to Supabase Storage → update `avatar_url`
- **Tier badge** — animated gold crown for Elite, bolt for Pro, seedling for Starter (matching membership.html icons)
- **Engagement summary card** — shows: joined date, total invoiced, active projects count, assigned strategist name (hardcoded "Mark Cartwright, Founder" for now)
- **Connected integrations** — show/hide section: Notion ✓, HubSpot (coming), Zapier (coming) — each with status dot

#### 7. Sidebar (enhanced)
Current: Logo + user chip + nav items + logout
New:
- **Tier indicator strip** — 4px left border on user chip, color matches tier (cyan=Starter, gold=Pro, white/glow=Elite)
- **Notification badge** — red dot on bell icon in topbar if any deliverable status='ready'
- **Collapse button** — `[←]` button collapses sidebar to icon-only mode (65px), expands on hover. State saved in `localStorage`
- **Nav grouping** — add group labels: WORKSPACE / ANALYTICS / SUPPORT / ACCOUNT
- **Progress mini-ring** — tiny SVG donut next to "Get Started" nav item showing onboarding % complete

---

### New CSS Additions Needed

```css
/* Donut ring component */
.donut-ring { /* SVG stroke-dashoffset animation */ }

/* Sparkline */
.sparkline { /* SVG polyline, no fill, 2px cyan stroke */ }

/* Counter animation */
.kpi-counter[data-target] { /* JS-driven, ease-out */ }

/* Sidebar collapsed state */
.sidebar.collapsed { width: 65px; }
.sidebar.collapsed .s-nav-item span,
.sidebar.collapsed .nav-group-label { display: none; }

/* Gantt bar */
.gantt-bar { /* grid-column based, border-radius 6px, height 32px */ }

/* Onboarding step */
.ob-step { /* checkbox + label + completion indicator */ }
.ob-step.done { opacity: 0.55; text-decoration: line-through; }

/* ROI counter */
.roi-number { font-family: var(--font-display); font-size: 3rem; font-weight: 900; }
```

---

### New JS Functions Needed

| Function | Purpose |
|---|---|
| `animateCounter(el, target, duration)` | requestAnimationFrame counter from 0 → target with ease-out |
| `renderDonut(svgEl, pct, color)` | Set stroke-dashoffset on SVG circle for donut ring |
| `renderSparkline(svgEl, dataArray)` | Plot SVG polyline from data array, normalized to SVG viewBox |
| `renderGantt()` | Map mgc_projects start/end dates to CSS grid-column positions |
| `initOnboarding()` | Load onboarding step state from localStorage, render checklist |
| `saveOnboardingStep(stepId, done)` | Persist step completion to localStorage |
| `startCountdown(targetDate, el)` | Live countdown timer to next session date |
| `toggleSidebar()` | Toggle .collapsed class + save to localStorage |
| `uploadAvatar(file)` | Upload to Supabase Storage, update mgc_client_profiles.avatar_url |

---

### Supabase Changes Needed

None for core sprint. Optional enhancements:
- Add `onboarding_steps` JSONB column to `mgc_client_profiles` to persist checklist server-side
- Add `strategist_name` TEXT column to `mgc_client_profiles`
- Add `confirmed_date` column to `mgc_bookings` (currently only `requested_date`)

---

### Execution Order for Next Session

1. **CSS pass** — add donut, sparkline, gantt, onboarding, ROI, sidebar-collapse styles to `<style>` block
2. **HTML structure** — add new panels (Onboarding, ROI), update Overview panel layout, add sidebar collapse button + group labels
3. **JS functions** — implement all new functions, wire to existing `loadPortalData()` flow
4. **Overview redesign** — replace current KPI tiles with new 4-card layout including SVG visualizations
5. **Projects Gantt** — add timeline toggle to projects panel
6. **Onboarding panel** — full 5-step checklist with localStorage persistence
7. **ROI panel** — all metric counters + sparklines wired to Supabase data
8. **Settings enhancements** — avatar upload, tier badge, engagement summary
9. **Polish pass** — sidebar collapse, notification dot, counter animations, stagger timing
10. **Deploy** — confirm with user before pushing to Netlify
