# CLAUDE.md archive — session handoffs 2026-10-04 through 2026-10-24

Moved out of the root `CLAUDE.md` on 2026-10-24 to keep that file small. These are full, resolved (or superseded) session handoffs, kept verbatim for forensic detail. The condensed list of anything still genuinely open from this range lives in `CLAUDE.md` under "Current state & open items." Don't re-read this file unless you need the blow-by-blow of how a past bug was found/fixed.

---

## Session handoff (2026-10-24, later): Vercel preview is live via a new repo/account — START HERE, one push pending

### Goal unchanged: Vercel is a testing/preview mirror only. Netlify stays the sole live/production site until the owner explicitly says go-live. Confirmed safe — the custom domain `mgcglobalconsulting.com` DNS points at Netlify, not Vercel.

### Context: the previous handoff's GitHub-App-permission blocker was routed around, not resolved
Rather than waiting on `mgcglobalconsulting` org GitHub App access (still not granted), the owner pushed this repo to a **new personal GitHub repo, `OneDopeStory/mgc`**, and connected that to a **new Vercel project, `mgc-site-complete-1`, under the `onedopestorys-projects` scope** — a Vercel login that *can* see/manage repos under the owner's personal GitHub account. This repo now has two remotes:
- `origin` → `mgcglobalconsulting/mgc-site-complete_1` (the org repo — GitHub's default `main` branch there is still just a 1-line README stub; real work tracks `local-main-2026-10-04`, per the previous handoff's finding)
- `onedope` → `OneDopeStory/mgc` (the new repo, now wired to the live Vercel preview)

The older `mgcglobalconsulting/mgc` repo + its `mgc-lyart.vercel.app` Vercel project (not visible from this login, likely tied to the suspended `mark@mgcglobalconsulting.com` Workspace billing — see prior handoff) was **not touched** this session and is still an open consolidation question for later.

### Done this session
- Pushed full history to `onedope` (`OneDopeStory/mgc`), connected it in the Vercel dashboard, triggered the first build with an empty commit.
- **Fixed real bug #1 — build failure.** First deploy failed with `exceeded_serverless_functions_per_deployment` (Vercel CLI didn't surface this; had to call the Vercel REST API directly with the CLI's stored token to get the real `errorMessage`). Cause: every `.js` under `api/` auto-becomes a Serverless Function — that folder's 18 files (an unused legacy Zapier scaffold, includes a committed `node_modules/`) blew past the Hobby plan's 12-function cap. **Fix:** added `.vercelignore` excluding `api/`. Committed `d2a3aa1`, pushed to `onedope/main`, redeployed — **Status: Ready, confirmed**.
- **Found real bug #2 — wrong content live.** Owner reported the live Vercel URL showed a totally unrelated 404 page ("member directory" branding, navy/gold palette). Root cause: Vercel's zero-config output-directory detection defaults to a `public/` subfolder when one exists — and this repo's `public/` is a **stale, incomplete old snapshot** (no `index.html`, old mismatched `404.html`, missing most current pages; confirmed via `netlify.toml` that Netlify has never served from `public/` — it was always dead weight there). **Fix:** added `"outputDirectory": "."` to root `vercel.json`. **Committed locally as `80fbc0f` — CONFIRMED NOT YET PUSHED** (`git fetch onedope` shows `onedope/main` still at `d2a3aa1`). This is the #1 action item.

### P0 — DONE (2026-10-24, later still): commit `80fbc0f` pushed, redeploy verified live
Owner pushed `80fbc0f` to `onedope/main` from their own terminal (same exposed token — **still needs revoking** at github.com/settings/tokens, not yet confirmed done). New deployment `mgc-site-complete-1-pez49h07a-onedopestorys-projects.vercel.app` built to **Status: Ready** in 6s. Direct `curl` couldn't verify content (Vercel's preview Deployment Protection/SSO wall 302-redirects anonymous requests to `vercel.com/sso-api` — expected, not a bug). Owner opened it in-browser and confirmed: **"its up and rendering"** — real homepage, not the stale `public/404.html`. Bug #2 fully resolved.

### Lower-priority Vercel item found, not fixed
`vercel.json`'s `/services` rewrite still points to the already-deleted `services.html` → will 404 on Vercel. `netlify.toml` already redirects `/services` → `/membership`; mirror that in `vercel.json` if/when touching the file again.

### Decision needed from owner — delete `public/` and `api/` from git?
Both folders are confirmed dead weight for both Netlify (`netlify.toml` → `publish = "."`, never read `public/`) and now Vercel (post-fix). `api/` also carries a committed `node_modules/` tree (real repo bloat) and only matters now because it's excluded via `.vercelignore`, not deleted. Not deleted yet — ask before removing, per this project's established "confirm before deleting" pattern.

### Investigated, diagnosed, NOT fixed — Google OAuth "dead zone" on the client portal
Owner reported: after completing Google sign-in consent on the client portal, it "doesn't go anywhere" — a dead zone. Read `dashboard.html`'s `doGoogleAuth()` (uses `signInWithOAuth({provider:'google', options:{redirectTo: origin + '/dashboard'}})`, correct) and `netlify.toml`'s `/dashboard` rule (correctly `200 → /dashboard.html`, not shadowed by any wildcard). **No code or routing bug found.** Working theory, unverified: this is an external config gap, not code —
1. Supabase dashboard → Authentication → URL Configuration → **Redirect URLs** allowlist may be missing `https://www.mgcglobalconsulting.com/dashboard` (and/or the Vercel preview origin, if testing there).
2. Google Cloud Console → the OAuth client's **Authorized redirect URIs** may be missing the Supabase callback `https://bjnpibxaxlgvlzeegwnm.supabase.co/auth/v1/callback`.

Could not inspect or fix via MCP — the Supabase MCP connection in this environment resolves to neither MGC's real project (`bjnpibxaxlgvlzeegwnm`) nor LoveLi's; it's pointed at an unrelated dead ref (`zppuzfvchqxkzprfkhfz`). **Next session: walk the owner through checking both allowlists manually**, or re-point the MCP connection to `bjnpibxaxlgvlzeegwnm` if possible.

### Color-token consistency audit — partially done, started from the owner's "pages should all be the same color" complaint
- **Confirmed real mismatch:** `partner-success.html` uses `--navy:#0f1c3f` vs. the canonical `--navy:#041C35` used by `index.html`/`book.html`/`onboarding-assistant.html`/`membership.html`. Not yet fixed.
- **Flagged, needs an owner decision, not necessarily a bug:** `dashboard.html` and `admin.html` both use a distinct palette (`--abyss:#010C1A; --navy:#041428; --sky:#1A8FD1`) different from the public marketing pages. Could be intentional (internal-tool visual distinction) or drift — ask before changing.
- **Inconclusive, needs re-checking properly (grep only matched `--navy`, didn't confirm the other three tokens):** `ai-consulting.html`, `ai-workshops.html`, `automation.html`, `crm-optimization.html`, `systems-design.html`, `retainer-support.html`.
- Root cause context for the owner's complaint about "Services" and mismatched pages: it traces back to the stale `public/`/`api/` folders (bug #2 above), not a broken link in the current root-level pages — `index.html`'s services links correctly point to the `#services` anchor, and both `/services.html` and `/services` already 301 to `/membership` in `netlify.toml`.

**How to apply next session:** start with the P0 push above and verify the live Vercel preview looks right end-to-end before touching anything else. Then work the remaining list top to bottom: public/api deletion decision → OAuth manual-config walkthrough → finish the color audit → fix `partner-success.html`.

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

(Also tracked in memory: `project_vercel_deletion_2026-10-16.md`.)

### Command Center dashboard — confirmed live, not lost, but running on sample data

`command-center.html` (+ `assets/command-center*.{css,js}`) is fully built and **committed to git** (contrary to an earlier stale memory note claiming it was "uncommitted, not deployed" — that's no longer true as of this session). It's a real admin dashboard with a "Staff and agents" section tracking 5 seeded demo agents (Intake, Client Success, Billing, Outreach, Ops Monitor) — if the owner ever shows a screenshot of an "Agentic staff / Workforce" table with a gold SAMPLE badge, **that is this page**, not a lost or external feature. Full spec: `docs/command-center.md`.
- **Still pending (owner decided this is next, 2026-10-16):** apply `supabase/migrations/20261005220000_command_center.sql` to the real Supabase project so the dashboard shows live data instead of SAMPLE fallbacks. Claude could not run this directly this session — the Supabase MCP connection available in this environment only reaches a different client's project (LoveLi), not MGC's `bjnpibxaxlgvlzeegwnm`. Needs to be run manually by the owner, or the MCP connection re-pointed.
- After that: populate `mgc_staff` with real human staff + hourly rates (the 5 agents are already seeded).
- **Not yet built:** the owner's bigger idea — TrueAssist/"Alex" automatically dispatching incoming form submissions to one of the 5 agent roles, with Slack approval for human oversight. This is a new feature on top of the existing (display-only) dashboard, not a restoration. Needs its own scoping session.
- Resend: owner has a Resend account and sent a successful test email, wants it wired into TrueAssist/"Alex" for client communications. **Not implemented anywhere in `netlify/functions/` yet** — `RESEND_API_KEY` was anticipated in the env var list but never wired to actual code.

(Also tracked in memory: `project_command_center.md`.)

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

## Session handoff (2026-10-05): fully resolved — kept for forensic record only

Verified live on 2026-10-05 with `netlify env:list`, `netlify api`, `curl` against production, and `git`.

**RESOLVED as of 2026-10-24 (re-verified when archiving):** the git merge conflict below is gone (`.git/MERGE_HEAD` no longer exists, branch is clean `main`). `services.html`, referenced in the pricing P0 below, no longer exists in the repo (consolidated into `membership.html`) — that P0 is moot/stale, not confirmed actively fixed in any single commit, just superseded by the services.html → membership.html consolidation. Don't assume current prices are correct from this note alone; check `membership.html` directly if pricing is ever in question again.

### Verified production facts (corrects earlier notes, at the time)

- **One Netlify site, not two.** `mgc-global-consulting` (ID `07dc7dd7-37b2-4044-8503-64e8ca7a9044`) owns the custom domain and serves **both** apex and `www`. The `www` CNAME target `luminous-heliotrope-0377ea.netlify.app` is that same site's original auto-generated name — not a separate site. `listSites` confirms only this one site has a custom domain.
- **Published deploy: 2026-10-05T01:07:21Z**, promoted from a deploy-preview created 01:03. The last deploy with `production` *context* was 2026-06-04, so "last prod deploy was June" is misleading — a preview was published on top of it.
- **The 2026-10-04 audit work is NOT live (at the time).** These returned 404 in production then: `404.html`, `403.html`, `terms.html`, `assets/mobile-nav.css`. (`terms.html` now exists in the working tree as of 2026-10-24 — recheck live status if it matters.)
- **CORRECTION — repo docs are NOT publicly exposed.** An earlier note claimed "all root markdown is publicly served." False for the current deploy: `CLAUDE.md`, `AGENTS.md`, `ALEX.md`, `BRANDING.md`, `.env.template`, `netlify.toml`, `package.json` all 404 live. **But this is luck, not configuration** — `netlify.toml` has no rule blocking `*.md` / `*.toml` / `.env.template` (only `/ruvector.db`). A full `netlify deploy --prod --dir .` **would** publish them. Add a block rule before the next prod deploy. (A real block-rule fix was added 2026-10-16, see above — re-verify it's still intact if touching `netlify.toml` redirects again.)

### P0 (at the time) — Live site was showing wrong prices

Production served the pre-audit price table. `services.html` live showed `$1,950` / `$2,200` and was missing the audited retainer tiers `$199` / `$499` / `$1,299`. Local was correct.

### P0 (at the time) — Git merge conflict blocked all commits

A merge was in progress (`.git/MERGE_HEAD` existed). `README.md` was `AA` (both-added), branch 27 commits ahead of `origin/main`.
- `ours` (`:2:README.md`) = 11,427 B — the real project README.
- `theirs` (`:3:README.md`) = 60 B — a GitHub stub: `# mgc-site-complete_1-update` / `full-site-vs-code-claude-codex`.
- Recommended at the time: keep `ours`. (Confirmed resolved — no MERGE_HEAD as of 2026-10-24.)

### P1 — Env var gaps (verified 2026-10-05, 24 vars set at the time)

**Were set then:** `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY_B64`, `NOTION_DEALS_DATABASE_ID`, `QB_ENVIRONMENT`, `SITE_URL`, all `STRIPE_PRICE_*` except one.

**Referenced by functions but NOT set in Netlify at the time:**

| Missing var(s) | Breaks |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | `payment-webhook.js` — no Stripe fulfilment at all |
| `NOTION_API_KEY`, `NOTION_COMPANIES_DATABASE_ID`, `NOTION_CONTACTS_DATABASE_ID`, `NOTION_INVOICES_DATABASE_ID` | all Notion CRM sync (`lead-intake`, `payment-webhook`, `new-client-signup`) |
| `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_WEBHOOK_URL`, `SLACK_RELAY_CHANNEL_ID`, `SLACK_RELAY_ALLOWED_BOT_IDS`, `SLACK_INQUIRIES_CHANNEL_ID`, `SLACK_INQUIRIES_WEBHOOK_URL`, `SLACK_NOTIFY_SECRET`, `SLACK_PAYMENTS_WEBHOOK` | TrueAssist Slack handoff + `slack-events` thread relay |
| `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_REALM_ID`, `QB_REFRESH_TOKEN` | `request-invoice.js` QuickBooks customer/invoice creation |
| `BOOKING_PRICE_USD` | `book.html` shows the function default **160**, not the decided **169** — **still true as of 2026-10-24, re-verified in code** (`netlify/functions/booking-assistant.js` still defaults to 160). |

### P1 — Env var NAME MISMATCH (real bug, one-line fix, status unconfirmed since)

`create-checkout.js` reads **`STRIPE_PRICE_MONTHLY_RETAINER`**. Netlify had it named **`STRIPE_PRICE_RETAINER`** at the time. Fix: rename the Netlify variable (no code change needed). Not reconfirmed in any later session — check Netlify env vars if a monthly-retainer checkout ever fails.

### Notes / lower priority (at the time)

- `NOTION_PROJECTS_DATABASE_ID` listed but not referenced by any function.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `RESEND_API_KEY`, `LEAD_EMAIL_FROM` listed but not found in `netlify/functions/`.
- `.netlify/functions/*.zip` build artifacts tracked in git and modified — consider gitignoring.
- **Still outstanding as of archiving (2026-10-24), not reconfirmed since 2026-10-03:** the QuickBooks client secret in `.env.template` (git history commits `17c5014`, `d7a81dd`) needs removal and rotation in the Intuit developer portal.

### Update (2026-10-05, later): Slack notify secret secured

- `SLACK_NOTIFY_SECRET` was set in Netlify to a real random 256-bit hex value.
- Needed then (status since unconfirmed): update the Database Webhook header `x-webhook-secret` on Supabase webhooks for `mgc_leads`, `mgc_bookings`, `mgc_client_profiles`, `mgc_messages`, `mgc_uploads`, `mgc_questionnaires` in project `bjnpibxaxlgvlzeegwnm`.
- The Supabase MCP connection available to Claude in this environment has never reached MGC's real project (`bjnpibxaxlgvlzeegwnm`) in any session through 2026-10-24 — any Supabase-side change for MGC still needs to be done manually or the MCP connection re-pointed.

---

## Site audit pass (2026-10-04, evening): done, don't redo

Full status: [docs/site-audit-2026-10-04.md](../site-audit-2026-10-04.md).

- **Done (uncommitted, on `main`, browser-checked at 375px and desktop):**
  - Prices on every page match the owner's six service lines.
  - Services page: Systems Design shows Custom / Enterprise; the Retainer card shows $199 to $1,299/mo.
  - Retainer page: tiers are Starter, Pro and Elite at $199, $499 and $1,299.
  - Each of the six service pages has a price section, a "Maryland-based. Serving clients nationwide." line, and the main CTA "Book a Strategy Call".
  - New pages: root `404.html`, `403.html`, `500.html`, and a draft `terms.html` marked for legal review.
  - Mobile menu: new `assets/mobile-nav.css` and `assets/mobile-nav.js`, used on services and membership.
  - Invoice requests on Services now report errors instead of always saying "sent".
- **Blocked (at the time, since resolved — see 2026-10-05 entry above):**
  - A merge was half-finished on `main`, `README.md` conflicting with a GitHub stub.
- **Owner decisions pending (at the time):**
  - Footer address: Baltimore 21202 (Services) or Owings Mills (home page).
- **Consultation price (decided 2026-10-04):** $169 for 60 minutes; first-time clients pay $50. Page copy updated at the time. Server-side `BOOKING_PRICE_USD=169` still not confirmed set — see the 2026-10-24 current-state note in `CLAUDE.md`.
- **Slack feed of all site inserts:** the owner approved one database webhook feeding a single `slack-notify` function that posts to #site-inquiries.

## Session handoff (2026-10-04): background only

**Objective then:** front-page visual system and the live TrueAssist experience, per [docs/site-experience-plan.md](../site-experience-plan.md) and [docs/hero-loop-storyboard.md](../hero-loop-storyboard.md).

**Done (local, not deployed, at the time):**
- Public TrueAssist widget on `index.html` (`#trueassist`), with `assets/trueassist-widget.js`/`.css`.
- Portal migration written: `supabase/migrations/20261003230000_portal_support_tables.sql`.
- Slack support-agent scaffold in `slack-agent/`. 43 template tests passed.
- Slack CLI v4.8.0 installed, not logged in.

**Pending then, needs owner action (status since unconfirmed unless noted elsewhere in this archive):**
- `slack login` + `slack app link` inside `slack-agent/`; `slack-agent/.env` with API keys; start with `npm start` not `slack run`.
- Set `ANTHROPIC_API_KEY` in Netlify — **confirmed done by 2026-10-05** (see above).
- Approve production push of the portal migration — not confirmed since.
- HeyGen avatar of Mark: owner consent given 2026-10-04, plan still needed.
- Higgsfield: free plan, 10 credits — preflight every generation.

**Open discrepancies flagged then:** whether `trueassist.js` (vs. `docs/trueassist-architecture.md`) was the accurate description of pricing/lead-capture/`/api/chat` handling. Not reconfirmed since.

**Rules carried forward (still in force, see root `CLAUDE.md`):** no `git push`, deploy, or production schema change without explicit approval. Do not read `.env*` files. Do not route around a denied action.
