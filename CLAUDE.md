# CLAUDE.md — MGC Global Consulting

Canonical project memory. Read this first; it is kept short on purpose to save tokens. Long reference material lives in `docs/reference/` (full archive: `docs/reference/CLAUDE-archive-2026-10-03.md`).

## Identity and stack
- **Site:** https://www.mgcglobalconsulting.com — MGC Global Consulting LLC (owner: Mark Cartwright, Founder). Enterprise AI strategy, automation, CRM optimization, systems design.
- **Stack:** static HTML/CSS/JS, no build step · Netlify (publish dir `.`) · Netlify Functions (Node 18+, esbuild) · Supabase (client portal, prefix `mgc_`) · Stripe · Notion CRM · HubSpot forms · Anthropic (AI assistants) · Google Calendar (bookings).
- **Local dev:** `npx netlify dev` (functions) or `python3 -m http.server 3456` (static only).

## Pages (root)
`index.html` (home + booking calendar) · `book.html` → `/book` (time picker + booking assistant) · `privacy.html` → `/privacy` (draft, needs legal review) · `services.html` · `membership.html` · `dashboard.html` (client portal) · `admin.html` · `onboarding-assistant.html` (AI assessment) · `checkout.html` · `thank-you.html` · `success.html` · service pages (`ai-consulting`, `ai-workshops`, `automation`, `crm-optimization`, `systems-design`, `retainer-support`) · `partner-success.html` · `403/404/500.html`.

Routes are defined in `netlify.toml`. `/terms` is linked from the footer but has no page yet.

## Netlify functions (`netlify/functions/`)
| Function | Purpose |
|---|---|
| `booking-assistant.js` | `slots` / `book` / `chat` actions. Google Calendar free/busy and event creation; Claude tool-use chat. Origin-locked, rate-limited. |
| `lead-intake.js` | Booking/contact form → Notion (Company → Contact → Deal). Used by the booking assistant too. |
| `trueassist.js` | `/api/chat`. Client advisor chat (Haiku): pricing from `mgc_service_pricing`, lead capture to `mgc_leads` + welcome email + Slack card, Slack handoff. See `docs/trueassist-architecture.md`. |
| `slack-events.js` | `/api/slack/events`. Relays Slack thread replies back into the TrueAssist chat. |
| `create-checkout.js` | Stripe Checkout; price IDs validated against an allowlist. |
| `payment-webhook.js` | `checkout.session.completed` → Notion fulfilment. |
| `request-invoice.js` | Custom invoice requests → Slack + QuickBooks customer/invoice creation and invoice email. |
| `new-client-signup.js` | Supabase signup webhook → Notion. |

## Booking system (decided 2026-10-03)
- **Source of truth:** Google Calendar (owner-owned). Apple Calendar and Notion Calendar sync from that Google account. See `docs/calendar-sync-guide.md`.
- **Defaults:** Mon–Fri, 8 am–8 pm America/New_York, 60-min sessions, $160, 24 h notice, 14 days ahead. All overridable by `BOOKING_*` env vars.
- **Not built yet:** payment collection for the $160 fee; `/terms` page.
- **Not deployed:** nothing here is live until Mark approves a deploy.

## Environment variables (names only — values live in Netlify, never in files)
Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` · Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY` · Notion: `NOTION_API_KEY`, `NOTION_{COMPANIES,CONTACTS,DEALS,PROJECTS,INVOICES}_DATABASE_ID` · Google: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY_B64`, `GOOGLE_CALENDAR_ID` (new) · AI: `ANTHROPIC_API_KEY`, optional `BOOKING_MODEL` · Slack/email (TrueAssist): `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_RELAY_CHANNEL_ID`, `RESEND_API_KEY`, `LEAD_EMAIL_FROM` · Other: `SLACK_PAYMENTS_WEBHOOK`, `SUPABASE_WEBHOOK_SECRET`, `SITE_URL`, `BOOKING_*`.
Full list: `.env.template` (tracked in git — it must contain placeholders only).

## Deployment and external actions — confirm first
- **Never** `git push`, `netlify deploy`, `vercel`, or any production change without explicit approval in the current conversation. Ask: "Ready to push to GitHub / deploy to Netlify?"
- Netlify site `mgc-global-consulting` (ID `07dc7dd7-37b2-4044-8503-64e8ca7a9044`, https://mgcglobalconsulting.com) is **not linked to a Git repo** (checked 2026-10-03). A GitHub push does NOT deploy. Production deploys are manual: `npx netlify deploy --prod --dir .`, which needs approval.
- Never send content to an outside service on the owner's behalf (email, post, invoice) without confirmation.

## Security rules
- Never remove or weaken security headers in `netlify.toml`.
- CORS on functions is locked to `https://www.mgcglobalconsulting.com` (and listed localhost for dev). Do not open to `*`.
- Stripe price IDs must come from the server-side allowlist.
- Anon key only in client code. Never embed the Supabase service-role key.
- `.env*` files are gitignored. Never commit secrets. Notion database IDs are referenced only via env vars (the secret scanner blocks hard-coded IDs).
- **Known exposure (2026-10-03):** a QuickBooks client secret was committed to `.env.template` in git history (commits `17c5014`, `d7a81dd`). The value is **still in the working-tree `.env.template`** (an edit to that file was blocked on 2026-10-03). Remove it and **rotate** the secret in the Intuit developer portal. Rewriting git history is a separate decision.
- Personal documents (credit, finance, IDs, receipts) are never served by or referenced from the public site or any site function. Personal AI work (the "Alex" credit assistant) lives in its own project folder.

## Design and marketing — how to respond
- Source of truth for visuals: `BRANDING.md` (colors, type, spacing, buttons, cards, motion). Tokens are live in `index.html` `:root`. Use `var(--token)`; never hard-code hex in HTML `style` attributes.
- Palette: abyss `#010C1A`, cyan `#00D4FF`, gold `#FFB347`. Fonts: Raleway (display, required), Plus Jakarta Sans (UI), Outfit (body), JetBrains Mono (eyebrows, data).
- No emojis anywhere. Icons are inline SVG. Every page has the nav and the scroll bar (`#scrollBar` in `index.html`/`book.html`/`privacy.html`; some older pages use `#scrollProgress` — match the page you're editing).
- **Response standard for design, marketing, and graphic requests:** give a complete, specific answer. Cover the audience and goal, the message hierarchy, the layout (sections in order), exact copy (headline, subhead, CTA), colors and type by token, spacing and motion, and what to check on mobile. Name the file and line where the change goes. If it's a Stitch or image prompt, use the four-part format (Idea / Theme / Content / Image). Say what you'd test next.

## Conventions
- Static HTML only — no React, Vue, or build pipeline on the frontend. Plain vanilla JS.
- Render dynamic and model text with `textContent`, not `innerHTML`.
- All nav links appear on every page with the same structure.
- Logo: `assets/mgc-logo-transparent.png` (root `assets/`). Do not use `assets/images/`.
- Functions use `Promise.allSettled` or try/catch so one downstream failure never blocks the response.
- Supabase tables are prefixed `mgc_`.

## Known discrepancies (resolve before relying on them)
- Some older statements here named a different canonical host and Supabase project than live production. See `.mgc-audit/MGC_WEBSITE_AUDIT.md` (F-10, F-12) before trusting either.
- `scrollProgress` vs `scrollBar` naming differs by page (see above).
- Footer links to `/terms`, which does not exist.

## Token-efficiency rules
- Read this file and the page you're editing. Skip the archive unless a task needs a section from it.
- Search with `rg`; `.ignore` excludes `node_modules`, `.claude-flow`, `.swarm`, `ruvector.db`, `open-seo`, and the large `.claude` skill folders.
- Ask for missing facts once, in a single list, rather than one at a time.

## Saved implementation shortcuts (Mark Garcia Cartwright)
- **“Implement MGC QuickBooks accounts”** → read [the QuickBooks spec](wiki/pages/quickbooks-account-spec.md). Sequence: verify sandbox/auth → account lookup → service-to-Item mapping → focused checks → report. Account management and invoice sending are separate actions; follow the spec's scope.
- **“Implement MGC Lycoris experience”** → read [the visual spec](wiki/pages/lycoris-experience-spec.md) and `BRANDING.md`. Sequence: static demo → MGC copy/tokens → scroll/WebGL behavior → accessibility/mobile checks → report. The supplied React source is reference material; keep the main site static.
- Read only the selected spec; load the large raw component only for the visual task. Specs are prepared, not implemented. Catalog and maintenance history: [wiki index](wiki/index.md).

## Reference (load only when needed)
- Full original CLAUDE.md: `docs/reference/CLAUDE-archive-2026-10-03.md`
- Stripe Workflows (public preview) — archive § "Stripe Workflows Reference"
- Workflow SDK (Vercel durable workflows) — archive § "Workflow SDK API Reference" (not used by this Netlify site)
- Vercel dev workflow notes — archive § "Vercel Dev Workflow Reference"
- Growth log and sprint plans — archive § "MGC Global Consulting LLC - AI Growth Log" and § "Dashboard Redesign Plan — Sprint 5"
- Calendar and booking setup — `docs/calendar-sync-guide.md`
- Higgsfield / HyperFrames prompt playbook — `docs/higgsfield-hyperframes-prompt-playbook.md`
- Website audit — `.mgc-audit/` (load only when auditing: "Read MGC_BUSINESS_CONTEXT.md and MGC_SITE_AUDIT_PROMPT.md, then run the MGC website audit.")
