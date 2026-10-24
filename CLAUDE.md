# CLAUDE.md — MGC Global Consulting

Canonical project memory. Read this first; it is kept short on purpose to save tokens. Long reference material lives in `docs/reference/` (full archive: `docs/reference/CLAUDE-archive-2026-10-03.md`).

## Document templates / stationery kit — source of truth for all outgoing MGC paperwork (planned feature, not yet built)

`mgc-stationary/` (local only, **not in git** — 329MB of raw `.ai`/`.psd`/`.jpg`/`.png`/`.zip`, see `.gitignore`) is the **official MGC stationery kit**: letterhead, executive letterhead, corporate letter, cover letter, fax cover, newsletter, report cover, memorandum, continuation sheet — each in US-Letter and 8x11, plus the brand guide and logo originals. `MGC-Global-Stationery-Kit` and `MGC-Global-Stationery-Kit 2` are identical duplicates (only differ by a stray `.DS_Store`) — treat `MGC-Global-Stationery-Kit` as canonical, `Kit 2` can be deleted.

**The owner's intent (stated 2026-10-24):** this kit is the permanent default "blank paper" for every piece of written documentation MGC ever sends out — thank-you letters, congratulations letters, form-submission confirmations, newsletters — whether written by staff or generated automatically by the TrueAssist/"Alex" agents. Two consumers, both unbuilt:
1. **Staff-facing admin tool** — a section of the admin panel (likely `admin.html` or a new `command-center.html` tab) where staff draft letters for clients (e.g., triggered by a portal form submission) using these templates, producing an editable/downloadable PDF.
2. **Agent-facing default** — TrueAssist/Alex should use the same templates as the default output format any time it generates client-facing written documentation from the website/functions side.

**Not yet done, open before building either:** the raw kit is full Illustrator/Photoshop source files, too large and wrong format to ship to the browser or a Netlify function as-is. Will need a lightweight derivative (e.g. flattened PNG/PDF backgrounds or an HTML/CSS template) committed into the actual repo (e.g. `assets/letterhead/`) before any PDF-generation code can reference it — do not point code at `mgc-stationary/` directly since it won't exist in deployed environments (it's gitignored). Scope the admin-tool UI and the PDF-generation approach (library choice, where it runs — function vs. client-side) as their own task before writing code; nothing here has been designed yet.

## Session handoff (2026-10-23, later): membership.html color/polish pass — START HERE for Client Portal feature

### Next session's lead task: build an actual Client Portal feature — BLOCKED, awaiting owner's reference material

The owner wants a real **Client Portal feature** (not the existing nav link — see below) that "stands out and matches the theme," with motion effects and images arranged "with a flow." **They explicitly said they will supply reference context/images before this should be designed** — do not start speculatively. When they return with that material, scope it as its own task (page location, content, layout) before writing any code. Likely relevant but unconfirmed: this may relate to `dashboard.html` (the existing client portal page) or may be a wholly new page — ask/confirm once reference material arrives, don't assume.

### Done this session — `membership.html` only, color/value-level edits, no structural changes

Per explicit owner instruction ("You're not changing them... Do not change the page because it's already designed... just change the colors... Don't duplicate the work"), every edit below was scoped to CSS token values and two small additions (a footer link swap, a nav jump-menu) — no tier-card content, layout, or structure was touched or duplicated.

- **Footer:** replaced the physical address with a clickable Instagram link (`@mgcglobal_ai` → `https://www.instagram.com/mgcglobal_ai/`), styled by the existing `footer a` rules.
- **Hero "MEMBERSHIP TIERS" pill → real jump-menu:** replaced the static eyebrow pill with `.hero-menu`, three links (`Membership Tiers` / `Compare Tiers` / `FAQ`) jumping to new `id="pricing"` / `id="compare"` / `id="faq"` anchors on the three main sections (`scroll-margin-top:110px` added so the sticky header doesn't cover the target). `html{scroll-behavior:smooth}` was already present.
- **Color palette reverted to officially match `index.html`:** the `:root` tokens (`--abyss`, `--navy`, `--sky`, `--royal`, `--pro`, `--t-mid`) had been brightened ~40% in an earlier, pre-this-session pass. Reverted them back to index.html's values (`--abyss:#010C1A`, `--navy:#041C35`, `--sky:#0A3A6B`, `--royal:#0055CC`), plus two hardcoded gradient literals in `.tier-starter`/`.tier-pro` that still referenced the brightened hex values after the token revert. Re-ran the WCAG 2.2 AA contrast script against the darker tokens and recorded ratios in a `:root` comment block — all pass. **Deliberately kept** `--t-dim` at 0.5 alpha (not reverted to the original 0.35) because 0.35 alpha fails AA on this darker abyss (3.14:1, needs 4.5:1) — this is a legitimate accessibility fix, not part of the unwanted brightening.
- **Preserved as explicitly requested:** the Elite tier's metallic-silver theme, and all existing motion (shine sweep, aura pulse, hero shimmer, staggered reveal, 3D tilt) — none of this was altered by the revert.
- **Client Portal nav link vs. Elite silver — fixed a real visual-identity collision:** my first pass gave the "Client Portal" nav link a silver/gray glow, which the owner correctly flagged as visually identical to Elite's signature metallic silver ("the gray... was like a metallic silver gray that I asked for and you made the client portal logo the same color gray"). Fixed: Client Portal is now pure white (`#fff`) with a **cyan**-tinted `text-shadow` glow instead, keeping Elite's silver unique.
- **Elite tier "pop" boost** (owner: "make that part of the page pop"): added a static (non-hover) `box-shadow`/border glow matching the weight Pro already had at rest, brightened `.tier-accent` to `--silver-light` with its own text-shadow, and increased the aura-pulse opacity range (0.4–0.85, was 0.3–0.65) and its radial-gradient alpha (0.55, was 0.35).
- Verified after each edit: div-tag balance (regex count of `<div` vs `</div>`), and `node --check` on the extracted inline `<script>` block. All passed. No browser/screenshot tool available in this environment — visual confirmation at 1440/390px per `DESIGN-STANDARDS.md` is still owner's to do, same as the Command Center item below.

**How to apply:** If the owner reports any color still looks wrong on membership.html, diff against `index.html`'s current `:root` first — that's now the source of truth for this page's palette. Do not re-brighten without a fresh explicit request.

## Session handoff (2026-10-23): START HERE

### Command Center "Overview" redesign — code complete, NOT visually verified

Implemented the full plan at `~/.claude/plans/moonlit-whistling-eclipse.md` (Outcrowd-style dashboard restyle of `command-center.html`'s Overview tab). All four target files touched: `command-center.html`, `assets/command-center.js`, `assets/command-center-glass.css`, `assets/command-center-fx.js`. No other page or function was touched.

**Done:**
- Sidebar collapsed to an icon-only rail (`.cc-rail`/`.cc-rail-icon`, 84px wide); top bar gained a `.cc-tabs` pill row. Both wired to the existing generic `data-view` router — no new routing logic needed.
- ECG heartbeat (canvas + `Ecg` class + `startHeart()`/`renderPulseStats()`) deleted entirely. Four straight-line chart functions deleted (`renderFunnel`, `renderSourceLines`, `renderWeekdayBars`, `renderAgentArea`). KPI sparklines stripped from `renderKpis()` — tiles are now flat label/value/delta.
- New Overview hero row: Welcome/TrueAssist-chat orb card, "Future events" card (from `mgc_bookings`), staff/agent roster preview (from `mgc_staff`) — rendered by three new functions `renderRosterPreview()`, `renderUrgentEvents()`, `renderWeeklyActivity()` (the third also drives a new 7-day activity-pill grid below the hero row).
- `#cc-target` monthly-revenue-target input relocated into the retained KPI/approvals cluster; `getTarget()`/`renderTarget()` logic unchanged, localStorage key unchanged — verified by grep that wiring is intact.
- Live chat box added to the Welcome orb: `initBriefChat()` in `command-center-fx.js` posts to `/api/chat`, history is a local JS array (NOT sessionStorage, deliberately isolated from `trueassist-widget.js`'s `mgc_trueassist_history`/`mgc_trueassist_session` keys), replies rendered via `textContent` only.
- `node --check` passed on both JS files. Grepped the whole repo for every deleted identifier/class (`cc-ecg`, `cc-strip`, `Ecg`, `startHeart`, `renderFunnel`, etc.) — zero leftover references. Caught and fixed a near-miss: `series()` was almost deleted as unused but is still called by `renderRevenue()` (Finance view, out of scope) — restored it.
- Confirmed `http://localhost:3456/command-center.html` returns 200 on the already-running static server.

**NOT done — this environment has no browser/screenshot tool, so none of this could be verified visually:**
- Desktop (1440px) / mobile (390px) screenshots per `DESIGN-STANDARDS.md`.
- Clicking through nav in both the new icon rail and new top tab bar to confirm active-state sync.
- Live round-trip test of the chat box (needs `npx netlify dev` for same-origin `/api/chat` — plain `http.server` will CORS-fail).
- Re-running the audit agent to compare the live result against the three original reference images.
**How to apply:** Next session, either run these checks yourself (open the page in an actual browser / use a screenshot-capable tool) or ask the owner to eyeball `http://localhost:3456/command-center.html?demo=1#overview` and report back before calling this redesign done.

**One design call made without owner sign-off, flag it:** the sidebar was narrowed to a pure icon rail, which means Mark's name/role text (`cc-user-meta`) is now hidden at the bottom (`.cc-side .cc-user-meta{display:none}` in `command-center-glass.css`) — only the avatar initials show. The plan said "keep the profile block," which was read as "don't delete the DOM," not "keep it visible at this width." If the owner wants the name visible, widen `.cc-side` back up or show it on hover/tooltip.

## Session handoff (2026-10-16): still outstanding, check next

### P0 — Possible lost/orphaned site version — CHECK THIS FIRST next session

A Vercel project named `mgc-site-complete_1-update` (id `prj_9xDoIEWeEJsyUInMiAVtpfsOTMTa`, under the owner's personal `onedopestory` Vercel account, created 2026-09-30) was **deleted** this session after the owner confirmed it looked like it was serving stale pages (it auto-built from this repo's `public/` folder, which was ~400 lines behind root on some pages). After deletion, the owner said this might have actually been **a different, more advanced site version** ("the other site we had") with admin/dashboard features and a different color style, not just a stale duplicate — this was never confirmed either way.

**What's certain:** deleting a Vercel *project* never deletes local files or git history — it only removes Vercel's own deployment record. No file on disk was touched by this deletion.

**What's unresolved:** no GitHub repo named to match `mgc-site-complete_1-update` exists under either the `mgcglobalconsulting` org or the owner's personal GitHub account (checked via `gh repo list` on both — only `mgc-site-complete_1`, `mgc`, `taste-tys-kitchen`, `lovelicare` exist). The owner has several other local folders on `~/Desktop` that were never compared against this repo and could be the real source: `MGC_V2`, `mgc-site`, `mgc-dashboard-examples`, `mgc-site-edits-todo`, `mgc-info-agent`, `mgc-automations`, `mgc-site-graphics` / `mgc-site-graphics copy` (the last two are already confirmed as the source of the v3 "liquid glass" Command Center restyle, so not the mystery). Owner's decision this session: don't chase it now, build from what's in `mgc-site-complete_1` — but asked explicitly that checking this comes first next time.
**How to apply:** Next session, before other work, offer to diff `mgc-site-complete_1` against each of those candidate folders (file-count + a few key pages) to settle whether anything was actually missed.

### Command Center dashboard — confirmed live, not lost, but running on sample data

`command-center.html` (+ `assets/command-center*.{css,js}`) is fully built and **committed to git** (contrary to an earlier stale memory note claiming it was "uncommitted, not deployed" — that's no longer true as of this session). It's a real admin dashboard with a "Staff and agents" section tracking 5 seeded demo agents (Intake, Client Success, Billing, Outreach, Ops Monitor) — if the owner ever shows a screenshot of an "Agentic staff / Workforce" table with a gold SAMPLE badge, **that is this page**, not a lost or external feature. Full spec: `docs/command-center.md`.
- **Still pending (owner decided this is next, 2026-10-16):** apply `supabase/migrations/20261005220000_command_center.sql` to the real Supabase project so the dashboard shows live data instead of SAMPLE fallbacks. Claude could not run this directly this session — the Supabase MCP connection available in this environment only reaches a different client's project (LoveLi), not MGC's `bjnpibxaxlgvlzeegwnm`. Needs to be run manually by the owner, or the MCP connection re-pointed.
- After that: populate `mgc_staff` with real human staff + hourly rates (the 5 agents are already seeded).
- **Not yet built:** the owner's bigger idea — TrueAssist/"Alex" automatically dispatching incoming form submissions to one of the 5 agent roles, with Slack approval for human oversight. This is a new feature on top of the existing (display-only) dashboard, not a restoration. Needs its own scoping session.
- Resend: owner has a Resend account and sent a successful test email, wants it wired into TrueAssist/"Alex" for client communications. **Not implemented anywhere in `netlify/functions/` yet** — `RESEND_API_KEY` was anticipated in the env var list but never wired to actual code.

### Other changes this session (2026-10-16), all local commit `be0082e` or later, nothing pushed to GitHub

- TrueAssist absorbed the old "MGC Navigator" bottom-right chat widget's functionality (quick-link chips for Pricing/Book a call/Client Portal, full site-page map in its system prompt) and Navigator was deleted entirely (CSS/HTML/JS all removed from `index.html`).
- Phone number corrected sitewide: `410-952-2846` → `1.443.208.8178` (direct, 24/7 client line), including `public/` but **not** `api/` (owner's call — `api/` is a separate Zapier/webhook scaffold, left untouched).
- Footer address corrected on `onboarding-assistant.html`: "Owings Mills, MD" → "101 W Lombard St, Baltimore, MD 21202" (owner confirmed Lombard St is correct; this was the last page still showing the old address).
- Fixed a real bug in `index.html`'s booking-form submit handler: it wasn't checking `res.ok` before showing "Request Received!" — a failed request looked identical to a successful one. Fixed to match `book.html`'s already-correct pattern.
- Added a hero "thought bubble" component below the `why-visual` image on `index.html` (frosted-glass, animated, `#MakeTheConnection` tagline + "Make The Connection" signature), and reworded the image caption to drop "Notion" branding in favor of "custom-built" / "connects."
- Added `.netlifyignore` — without it, `netlify deploy` was trying to upload 23,000+ files (other projects' `node_modules`, the `slack-agent` sub-app, `.netlify` cache, `open-seo`, vault notes, etc. that happen to live in this same folder). Cut to ~2,100 files deploy-ready.
- **Security fix, found live during this session's draft deploy:** `CLAUDE.md`, `AGENTS.md`, `README.md`, `BRANDING.md`, `DESIGN.md`, `ALEX.md`, `package.json`, `package-lock.json`, and the stray `api/` scaffold were all publicly fetchable on the draft URL (netlify.toml had no block rule — this was flagged as a risk back on 2026-10-05 and it wasn't luck this time). Added ~25 explicit 404 redirect rules in `netlify.toml` to block all of them. **Caution for next session:** when adding more block rules, add them at the *end* of the redirects list, not the top — a first version of this fix accidentally shadowed the real `/api/chat` and `/api/slack/events` function rewrites (they're defined much further down the file) and broke TrueAssist's actual chat endpoint and the Slack relay until caught and fixed. Verified working again before moving on.
- Netlify CLI deploy (`npx netlify deploy --dir .`, no `--prod`) was blocked once by this environment's sandbox safety classifier ("Data Exfiltration") when attempted from inside the session; it worked fine once the owner ran/re-triggered it directly. A draft preview was created and verified (security blocks working, API routes working, `/public/...` legacy redirects still working, real pages all 200). **Not promoted to production** — awaiting the owner's explicit go-ahead for `--prod`.
- Deleted the orphaned Vercel project `mgc-site-complete_1-update` (see P0 section above for the open question this raised).

## Session handoff (2026-10-05): START HERE

Everything in this section was verified live on 2026-10-05 with `netlify env:list`, `netlify api`, `curl` against production, and `git`. It **supersedes** any conflicting statement later in this file.

### Verified production facts (corrects earlier notes)

- **One Netlify site, not two.** `mgc-global-consulting` (ID `07dc7dd7-37b2-4044-8503-64e8ca7a9044`) owns the custom domain and serves **both** apex and `www`. The `www` CNAME target `luminous-heliotrope-0377ea.netlify.app` is that same site's original auto-generated name — not a separate site. `listSites` confirms only this one site has a custom domain.
- **Published deploy: 2026-10-05T01:07:21Z**, promoted from a deploy-preview created 01:03. The last deploy with `production` *context* was 2026-06-04, so "last prod deploy was June" is misleading — a preview was published on top of it.
- **The 2026-10-04 audit work is NOT live.** These return 404 in production: `404.html`, `403.html`, `terms.html`, `assets/mobile-nav.css`.
- **CORRECTION — repo docs are NOT publicly exposed.** An earlier note claimed "all root markdown is publicly served." False for the current deploy: `CLAUDE.md`, `AGENTS.md`, `ALEX.md`, `BRANDING.md`, `.env.template`, `netlify.toml`, `package.json` all 404 live. **But this is luck, not configuration** — `netlify.toml` has no rule blocking `*.md` / `*.toml` / `.env.template` (only `/ruvector.db`). A full `netlify deploy --prod --dir .` **would** publish them. Add a block rule before the next prod deploy.

### P0 — Live site is showing wrong prices

Production still serves the pre-audit price table. `services.html` live shows `$1,950` / `$2,200` and is missing the audited retainer tiers `$199` / `$499` / `$1,299`. Local is correct. Customers are seeing stale pricing right now. This is the highest-priority item and it is blocked only by the merge conflict below.

### P0 — Git merge conflict blocks all commits

A merge is in progress (`.git/MERGE_HEAD` exists). `README.md` is `AA` (both-added). Branch is **27 commits ahead** of `origin/main`. Nothing can be committed until this is resolved.

- `ours` (`:2:README.md`) = 11,427 B — the real project README.
- `theirs` (`:3:README.md`) = 60 B — a GitHub stub: `# mgc-site-complete_1-update` / `full-site-vs-code-claude-codex`.
- **Recommended:** keep `ours`, then conclude the merge. Needs owner approval before any commit.

### P1 — Env var gaps (verified 2026-10-05, 24 vars set)

**Now set — earlier "missing" notes were stale:** `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY` (TrueAssist fallback resolved), `SUPABASE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY_B64`, `NOTION_DEALS_DATABASE_ID`, `QB_ENVIRONMENT`, `SITE_URL`, all `STRIPE_PRICE_*` except the one below.

**Referenced by functions but NOT set in Netlify:**

| Missing var(s) | Breaks |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | `payment-webhook.js` — no Stripe fulfilment at all |
| `NOTION_API_KEY`, `NOTION_COMPANIES_DATABASE_ID`, `NOTION_CONTACTS_DATABASE_ID`, `NOTION_INVOICES_DATABASE_ID` | all Notion CRM sync (`lead-intake`, `payment-webhook`, `new-client-signup`) |
| `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_WEBHOOK_URL`, `SLACK_RELAY_CHANNEL_ID`, `SLACK_RELAY_ALLOWED_BOT_IDS`, `SLACK_INQUIRIES_CHANNEL_ID`, `SLACK_INQUIRIES_WEBHOOK_URL`, `SLACK_NOTIFY_SECRET`, `SLACK_PAYMENTS_WEBHOOK` | TrueAssist Slack handoff + `slack-events` thread relay |
| `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_REALM_ID`, `QB_REFRESH_TOKEN` | `request-invoice.js` QuickBooks customer/invoice creation |
| `BOOKING_PRICE_USD` | `book.html` shows the function default **160**, not the decided **169** |

### P1 — Env var NAME MISMATCH (real bug, one-line fix)

`create-checkout.js:28` and `:46` read **`STRIPE_PRICE_MONTHLY_RETAINER`**. Netlify has it named **`STRIPE_PRICE_RETAINER`**. The `monthly-retainer` checkout therefore resolves to `undefined` and fails.
**Fix:** rename the Netlify variable to `STRIPE_PRICE_MONTHLY_RETAINER` (no code change needed).

### Notes / lower priority

- `NOTION_PROJECTS_DATABASE_ID` is listed in the env section below but is **not referenced by any function**.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `RESEND_API_KEY`, `LEAD_EMAIL_FROM` are listed below but were not found in `netlify/functions/`. Verify before provisioning.
- `.netlify/functions/*.zip` build artifacts are **tracked in git** and currently modified. Consider gitignoring.
- **Still outstanding:** the QuickBooks client secret in the working-tree `.env.template` (tracked in git, history commits `17c5014`, `d7a81dd`) needs removal and rotation in the Intuit portal. Not inspected this session — the "do not read `.env*`" rule was respected.

### Suggested order for the fresh session

1. Resolve `README.md` conflict (keep `ours`), finish the merge — **ask before committing**.
2. Add a `netlify.toml` redirect blocking `/*.md`, `/*.toml`, `/.env*`, `/package.json`.
3. Rename `STRIPE_PRICE_RETAINER` → `STRIPE_PRICE_MONTHLY_RETAINER`; add `BOOKING_PRICE_USD=169`.
4. Add `STRIPE_WEBHOOK_SECRET` + the four Notion vars (owner supplies values).
5. Draft deploy, verify prices and the 404/terms pages on the preview URL, **then ask** before `--prod`.

### Update (2026-10-05, later): Slack notify secret secured — pick up here next session

- `SLACK_NOTIFY_SECRET` is **no longer missing**. It's set in Netlify (`mgc-global-consulting`, all contexts) to a real random 256-bit hex value (generated with `openssl rand -hex 32`). Remove it from the "NOT set in Netlify" table above — that row is stale.
- **Not yet done — needs the owner, manually, in the Supabase dashboard:** add/update the Database Webhook header `x-webhook-secret: <the new value>` on the webhooks for `mgc_leads`, `mgc_bookings`, `mgc_client_profiles`, `mgc_messages`, `mgc_uploads`, `mgc_questionnaires` in project `bjnpibxaxlgvlzeegwnm` (Database → Webhooks). The actual secret value was shown to the owner in-chat this session, not stored in any file — ask the owner for it or regenerate.
- **Not yet done — needs a prod deploy** (held pending approval, same as the P0 pricing fix above): until `netlify deploy --prod` runs, the live `slack-notify.js` function is still running with the *old placeholder* value, so the webhook will 401 even after the Supabase header is updated. Bundle this into the same deploy as the pricing fix if possible.
- **Heads up:** the Supabase project `bjnpibxaxlgvlzeegwnm` (MGC's real project) is reportedly undergoing upgrades outside this session — re-verify its schema/webhooks/auth state before trusting earlier notes about it, rather than assuming no drift.
- Also reconfirmed: the Supabase MCP connection available to Claude in this environment only has access to a **different client's** project (`lphudfgjbsyhroqmhomh`, LoveLi Care) — MGC's `bjnpibxaxlgvlzeegwnm` is not reachable via MCP here, so any Supabase-side change for MGC must be done manually or the MCP connection re-pointed.

---

## Site audit pass (2026-10-04, evening): done, don't redo

Full status: [docs/site-audit-2026-10-04.md](docs/site-audit-2026-10-04.md).

- **Done (uncommitted, on `main`, browser-checked at 375px and desktop):**
  - Prices on every page match the owner's six service lines.
  - Services page: Systems Design shows Custom / Enterprise; the Retainer card shows $199 to $1,299/mo.
  - Retainer page: tiers are Starter, Pro and Elite at $199, $499 and $1,299.
  - Each of the six service pages has a price section, a "Maryland-based. Serving clients nationwide." line, and the main CTA "Book a Strategy Call".
  - New pages: root `404.html`, `403.html`, `500.html`, and a draft `terms.html` marked for legal review.
  - Mobile menu: new `assets/mobile-nav.css` and `assets/mobile-nav.js`, used on services and membership.
  - Invoice requests on Services now report errors instead of always saying "sent".
- **Blocked:**
  - A merge is half-finished on `main`. `README.md` conflicts with a two-line stub from GitHub, so nothing can be committed until the owner resolves it. Creating a branch was also denied.
  - ~~No deploy preview yet~~ — superseded: three deploy-previews exist (2026-10-05, 00:05 / 00:59 / 01:03 UTC) and the 01:03 one was published to production at 01:07. None contains the audit work.
- **Owner decisions pending:**
  - Footer address: Baltimore 21202 (Services) or Owings Mills (home page).
- **Consultation price (decided 2026-10-04):** $169 for 60 minutes; first-time clients pay $50. The page copy is updated. Still needed server-side: `BOOKING_PRICE_USD=169` in Netlify (the function default is 160, and book.html shows whatever the function returns). The $50 first-time price is display only until booking payment is built.
- **Slack feed of all site inserts:** the owner approved one database webhook feeding a single `slack-notify` function that posts to #site-inquiries. It is being built by the "Fix Supabase login and sync" thread, which owns `netlify/` and `supabase/`. Not this thread.

## Session handoff (2026-10-04): background only — see the 2026-10-05 section above first

**Objective for next session:** front-page visual system and the live TrueAssist experience. Pick one loop and one promo from [docs/site-experience-plan.md](docs/site-experience-plan.md) and the hero storyboard in [docs/hero-loop-storyboard.md](docs/hero-loop-storyboard.md).

**Done (local, not deployed):**
- Public TrueAssist widget on `index.html` (`#trueassist`), with [assets/trueassist-widget.js](assets/trueassist-widget.js) and [assets/trueassist-widget.css](assets/trueassist-widget.css). Syntax-checked and served locally. Not yet tested in a browser.
- Portal migration written: [supabase/migrations/20261003230000_portal_support_tables.sql](supabase/migrations/20261003230000_portal_support_tables.sql). Remote migration history was fetched into `supabase/migrations/`.
- Slack support-agent scaffold in [slack-agent/](slack-agent/). Local manifest trimmed to bot scopes. 43 template tests pass.
- Slack CLI v4.8.0 installed. Not logged in.

**Pending, needs owner action:**
- `slack login`, then `slack app link` inside `slack-agent/`. Create `slack-agent/.env` with `ANTHROPIC_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`. Start with `npm start`, not `slack run`, because `slack run` syncs the manifest to the live Slack app.
- Set `ANTHROPIC_API_KEY` in Netlify. TrueAssist returns the friendly fallback until it's set.
- Approve the production push of the portal migration. The auto-mode classifier denied it, and nothing was applied.
- Approve any Netlify deploy. None has been made.
- Owner consent for a HeyGen avatar of Mark: given 2026-10-04. A HeyGen plan is still needed.
- Higgsfield: free plan, 10 credits. Preflight every generation.

**Open discrepancies to verify:**
- This file says `trueassist.js` handles pricing, lead capture, and `/api/chat`. The function read on 2026-10-04 does not. Check `docs/trueassist-architecture.md` before relying on either.
- A new image was sent on 2026-10-04 without a description. Its purpose is unknown.

**Rules carried forward:** no `git push`, deploy, or production schema change without explicit approval. Do not read `.env*` files. Do not route around a denied action.

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
