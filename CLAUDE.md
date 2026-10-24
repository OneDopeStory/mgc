# CLAUDE.md — MGC Global Consulting

Canonical project memory. Read this first; it is kept short on purpose to save tokens. Detailed facts live elsewhere — use the map below to go get them, don't load everything up front.

## Map — where things live

```
mgc-site-complete_1/
├── CLAUDE.md                              you are here — open action items + stable facts only
├── docs/
│   ├── reference/
│   │   ├── CLAUDE-archive-2026-10-03.md     pre-10-03 CLAUDE.md + Stripe/Workflow-SDK/Vercel-dev reference
│   │   └── CLAUDE-archive-2026-10-24.md     full narrative of resolved handoffs, 2026-10-04 → 2026-10-23
│   ├── command-center.md                  Command Center dashboard full spec
│   ├── trueassist-architecture.md         TrueAssist/"Alex" chat function design
│   ├── calendar-sync-guide.md             Google/Apple/Notion calendar sync setup
│   ├── site-audit-2026-10-04.md           pricing/page audit detail
│   └── higgsfield-hyperframes-prompt-playbook.md
├── wiki/pages/                            specs for "saved implementation shortcuts" (bottom of this file)
├── netlify/functions/                     serverless functions — table below is the index
├── .mgc-audit/                            load only when explicitly running a full site audit
└── ~/.claude/…/memory/MEMORY.md           cross-session memory index (project/feedback/reference notes)
```

**Rule for future sessions:** when a handoff is fully resolved, move its play-by-play into a dated file under `docs/reference/` and leave at most the open action items here. Don't let more than one active handoff accumulate inline in this file.

## Current state & open items (as of 2026-10-24)

**Vercel is a testing/preview mirror only — Netlify stays the sole live/production site** until the owner explicitly says go-live. DNS for `mgcglobalconsulting.com` points at Netlify, not Vercel — confirmed safe.

- **Repos/remotes:** local `main` = `onedope` remote (`OneDopeStory/mgc`) = commit `80fbc0f`, wired to Vercel project `mgc-site-complete-1` (scope `onedopestorys-projects`) — current and live, confirmed by the owner in-browser. `origin` (`mgcglobalconsulting/mgc-site-complete_1`) is still a stale 1-line README stub, not the work branch. An older `mgcglobalconsulting/mgc` repo + `mgc-lyart.vercel.app` Vercel project (different login, likely tied to suspended Workspace billing) is untouched — open consolidation question.
- **Open — revoke the exposed GitHub token** used to set this up, at github.com/settings/tokens. Not yet confirmed done.
- **Open — `vercel.json`'s `/services` rewrite** still points to deleted `services.html` → 404s on Vercel. Mirror `netlify.toml`'s `/services` → `/membership` redirect next time the file is touched.
- **Open decision — delete `public/` and `api/` from git?** Both confirmed dead weight on Netlify (`publish = "."`) and Vercel (post `outputDirectory` fix). `api/` also carries a committed `node_modules/`. Ask before deleting.
- **Open — Google OAuth "dead zone"** on the client portal: after Google consent, `dashboard.html` goes nowhere. Code and `netlify.toml` routing both check out clean — likely an external config gap. Supabase MCP here can't reach MGC's project, so check manually:
  1. Supabase → Authentication → URL Configuration → Redirect URLs allowlist may be missing `https://www.mgcglobalconsulting.com/dashboard`.
  2. Google Cloud Console OAuth client's Authorized redirect URIs may be missing `https://bjnpibxaxlgvlzeegwnm.supabase.co/auth/v1/callback`.
- **Open — color-token audit** (from the owner's "pages should all be the same color" complaint): `partner-success.html` uses `--navy:#0f1c3f` vs. canonical `--navy:#041C35` (index/book/onboarding-assistant/membership) — not fixed. `dashboard.html`/`admin.html` intentionally(?) use a different palette — ask before changing. `ai-consulting.html`, `ai-workshops.html`, `automation.html`, `crm-optimization.html`, `systems-design.html`, `retainer-support.html` still need a full 4-token recheck (only `--navy` was grepped so far).
- **Open — booking price mismatch:** decided price is $169, but `netlify/functions/booking-assistant.js` still defaults `SESSION_PRICE_USD` to 160 (`BOOKING_PRICE_USD` env var apparently still unset). Verify before relying on `book.html`'s displayed price.
- **Blocked, awaiting owner material — Client Portal feature redesign.** Owner wants a standout version with motion/flow; said they'll supply reference images first. Don't start speculatively.
- **Needs visual verification (no browser tool in this environment) — Command Center "Overview" redesign.** Code complete (icon rail, tab bar, ECG/sparklines removed, new hero row, live chat box). Owner should eyeball `command-center.html?demo=1#overview` at 1440/390px before this is called done. One unsanctioned call made: the sidebar's name/role text is hidden at icon-rail width (`cc-user-meta{display:none}`) — widen `.cc-side` or add a tooltip if the owner wants it visible.
- Full narrative for all of the above, plus older fully-resolved items (Vercel function-cap fix, `public/`-as-output-dir bug, 2026-10-16's orphaned-Vercel-project question, 2026-10-05's merge-conflict/pricing P0 — both since confirmed resolved — and the 2026-10-04 TrueAssist/Slack-agent scaffold work): `docs/reference/CLAUDE-archive-2026-10-24.md`.

## Document templates / stationery kit — source of truth for all outgoing MGC paperwork (planned feature, not yet built)

`mgc-stationary/` (local only, **not in git** — 329MB of raw `.ai`/`.psd`/`.jpg`/`.png`/`.zip`, see `.gitignore`) is the **official MGC stationery kit**: letterhead, executive letterhead, corporate letter, cover letter, fax cover, newsletter, report cover, memorandum, continuation sheet — each in US-Letter and 8x11, plus the brand guide and logo originals. `MGC-Global-Stationery-Kit` and `MGC-Global-Stationery-Kit 2` are identical duplicates (only differ by a stray `.DS_Store`) — treat `MGC-Global-Stationery-Kit` as canonical, `Kit 2` can be deleted.

**Owner's intent:** permanent default "blank paper" for every piece of written documentation MGC sends — thank-you/congratulations letters, confirmations, newsletters — whether written by staff or generated by TrueAssist/"Alex". Two unbuilt consumers:
1. **Staff-facing admin tool** — a section of the admin panel (`admin.html` or a `command-center.html` tab) where staff draft client letters into an editable/downloadable PDF.
2. **Agent-facing default** — TrueAssist/Alex uses the same templates for any client-facing document it generates.

**Blocker before building either:** the raw kit is Illustrator/Photoshop source, wrong format to ship. Needs a lightweight derivative (flattened PNG/PDF background or HTML/CSS template) committed into the repo (e.g. `assets/letterhead/`) first — never point code at `mgc-stationary/` directly, it's gitignored and won't exist in deployed environments. Scope the admin-tool UI and PDF-generation approach (library, where it runs) as its own task before writing code.

## Identity and stack
- **Site:** https://www.mgcglobalconsulting.com — MGC Global Consulting LLC (owner: Mark Cartwright, Founder). Enterprise AI strategy, automation, CRM optimization, systems design.
- **Stack:** static HTML/CSS/JS, no build step · Netlify (publish dir `.`) · Netlify Functions (Node 18+, esbuild) · Supabase (client portal, prefix `mgc_`) · Stripe · Notion CRM · HubSpot forms · Anthropic (AI assistants) · Google Calendar (bookings).
- **Local dev:** `npx netlify dev` (functions) or `python3 -m http.server 3456` (static only).

## Pages (root)
`index.html` (home + booking calendar) · `book.html` → `/book` (time picker + booking assistant) · `privacy.html` → `/privacy` (draft, needs legal review) · `terms.html` · `membership.html` (pricing/tiers — replaced `services.html`, which no longer exists; `/services` redirects here) · `dashboard.html` (client portal) · `admin.html` · `command-center.html` (admin KPI dashboard, see `docs/command-center.md`) · `crm.html` · `onboarding-assistant.html` (AI assessment) · `checkout.html` · `thank-you.html` · `success.html` · service pages (`ai-consulting`, `ai-workshops`, `automation`, `crm-optimization`, `systems-design`, `retainer-support`) · `partner-success.html` · `403/404/500.html`.

Routes are defined in `netlify.toml`.

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
- **Defaults:** Mon–Fri, 8 am–8 pm America/New_York, 60-min sessions, 24 h notice, 14 days ahead. All overridable by `BOOKING_*` env vars.
- **Price mismatch (open, see Current state above):** decided price is $169; code (`booking-assistant.js`) still defaults to $160 pending `BOOKING_PRICE_USD`.
- **Not built yet:** payment collection for the booking fee.

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

## Token-efficiency rules
- Read this file and the page you're editing. Skip anything under `docs/reference/` unless a task needs a section from it — that's where resolved handoffs and deep reference material live, by design.
- When a session handoff is fully resolved, move the detailed narrative into a dated `docs/reference/CLAUDE-archive-<date>.md` and leave only still-open items (or nothing) in the "Current state & open items" section above. Keep that section to a handful of bullets, not a full rewrite each session.
- Search with `rg`; `.ignore` excludes `node_modules`, `.claude-flow`, `.swarm`, `ruvector.db`, `open-seo`, and the large `.claude` skill folders.
- Ask for missing facts once, in a single list, rather than one at a time.

## Saved implementation shortcuts (Mark Garcia Cartwright)
- **“Implement MGC QuickBooks accounts”** → read [the QuickBooks spec](wiki/pages/quickbooks-account-spec.md). Sequence: verify sandbox/auth → account lookup → service-to-Item mapping → focused checks → report. Account management and invoice sending are separate actions; follow the spec's scope.
- **“Implement MGC Lycoris experience”** → read [the visual spec](wiki/pages/lycoris-experience-spec.md) and `BRANDING.md`. Sequence: static demo → MGC copy/tokens → scroll/WebGL behavior → accessibility/mobile checks → report. The supplied React source is reference material; keep the main site static.
- Read only the selected spec; load the large raw component only for the visual task. Specs are prepared, not implemented. Catalog and maintenance history: [wiki index](wiki/index.md).

## Reference (load only when needed)
- Resolved session handoffs 2026-10-04 → 2026-10-23 (full narrative): `docs/reference/CLAUDE-archive-2026-10-24.md`
- Pre-10-03 CLAUDE.md, in full: `docs/reference/CLAUDE-archive-2026-10-03.md`
  - Stripe Workflows (public preview) — § "Stripe Workflows Reference"
  - Workflow SDK (Vercel durable workflows) — § "Workflow SDK API Reference" (not used by this Netlify site)
  - Vercel dev workflow notes — § "Vercel Dev Workflow Reference"
  - Growth log and sprint plans — § "MGC Global Consulting LLC - AI Growth Log" and § "Dashboard Redesign Plan — Sprint 5"
- Calendar and booking setup — `docs/calendar-sync-guide.md`
- Higgsfield / HyperFrames prompt playbook — `docs/higgsfield-hyperframes-prompt-playbook.md`
- Website audit — `.mgc-audit/` (load only when auditing: "Read MGC_BUSINESS_CONTEXT.md and MGC_SITE_AUDIT_PROMPT.md, then run the MGC website audit.")
