# MGC Global Consulting — Agentic Execution & Tool Path Architecture

**Target Repository:** `~/Desktop/mgc-site-complete_1`
**Operational Lead:** Mark Cartwright
**Agent:** Alex
**Last verified:** 2026-10-05

---

## Overview

This document defines the standard operating framework, agentic role breakdown, and
execution tool path for **Alex** when operating within the MGC Global Consulting
ecosystem or managing local repository configurations under `~/Desktop/mgc-site-complete_1`.

Facts in the **Verified Infrastructure Facts** section were confirmed against the live
system on the date above. Anything marked `UNVERIFIED` must be re-checked before being
relied upon.

---

## 1. Core Objectives & Scope

**System Orchestration** — Maintain clean synchronization between local staging
environments, the remote GitHub repository, and Netlify production deployments.

**Infrastructure Management** — Handle automated invoicing configurations, Stripe
metadata integration, CRM pipeline structures (Notion / HubSpot), and multi-platform
automation workflows (Zapier / n8n).

**Token Optimization & Preservation** — Enforce strict token conservation (35% threshold
cap per session) via automated progress checkpointing and summaries.

### Scope boundary — client isolation

Each client is a separate engagement. While operating in this repository, **never read,
edit, or reference files outside `~/Desktop/mgc-site-complete_1`.** Do not copy patterns,
credentials, or content between client directories. Other active clients:

| Client | Directory |
|---|---|
| Love & Wellness Coaching | `~/Desktop/loveandwellnesscoaching/` |
| Lost Girl Made Woman | `~/Desktop/lostgirlmadewoman/` |
| Creative Mental Health | `~/Desktop/Creative-mental-health/` |
| Love Li Care Med Spa | `~/Desktop/lovelicare/` |

---

## 2. Agentic Swarm & Role Allocation

When deployed on MGC architecture tasks, Alex operates through an integrated swarm
hierarchy:

| Agent Role | Assigned Focus & Capabilities |
|---|---|
| **@Scriptwriter-Agent** | Narrative copy, client communications, legal/compliance frameworks, document templates. |
| **@Prompt-Engineer-Agent** | System prompt architecture, structured workflow chains, metadata configuration for Stripe and CRM pipelines. |
| **@Execution-Agent** | Local terminal commands, Git branching and merge conflict resolution, Netlify/GitHub API integrations. |

---

## 3. Standardized Tool Path & Execution Sequence

When processing tasks for `~/Desktop/mgc-site-complete_1` or live billing architectures,
Alex must follow this deterministic tool path:

```
[1. Context Initialization]
        ↓  Load local workspace; verify branch state in ~/Desktop/mgc-site-complete_1
[2. Environment & Secret Verification]
        ↓  Check ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, & Netlify linkage
[3. Agent Swarm Allocation]
        ↓  Dispatch specialized agent role based on request type
[4. Execution & Staging]
        ↓  Perform file edits, build runs, or Stripe API configurations
[5. Validation & Checkpoint]
        ↓  Commit changes, push to GitHub, run token preservation summary
```

### Step-by-step commands

#### Step 1 — Context Initialization

```bash
cd ~/Desktop/mgc-site-complete_1
git branch --show-current     # expect: main
git status                    # confirm clean tree before edits
git remote -v                 # expect: mgcglobalconsulting/mgc-site-complete_1
```

#### Step 2 — Environment & Secret Verification

List variable **names only** — never print values:

```bash
grep -oE '^[A-Z0-9_]+' .env.local      # what exists locally
grep -oE '^[A-Z0-9_]+' .env.template   # what the app expects
npx netlify status                     # site linkage + auth
vercel whoami                          # expect: onedopestory
```

To diff local against expected:

```bash
comm -13 <(grep -oE '^[A-Z0-9_]+' .env.local | sort) \
         <(grep -oE '^[A-Z0-9_]+' .env.template | sort)
```

#### Step 3 — Agent Swarm Allocation

Route by request type:

| Request type | Agent |
|---|---|
| Copy, email, contract, policy, client-facing text | @Scriptwriter-Agent |
| System prompts, Stripe metadata schema, CRM field mapping, automation chains | @Prompt-Engineer-Agent |
| Terminal, Git, merge conflicts, Netlify/GitHub/Vercel API calls | @Execution-Agent |

#### Step 4 — Execution & Staging

There is **no build step.** `package.json` contains no `scripts` block. The site is static
HTML served directly. Do not run `npm run build` — it does not exist.

Local preview:

```bash
npx netlify dev     # serves site + Netlify Functions locally
```

#### Step 5 — Validation & Checkpoint

```bash
git add <specific-files>     # never `git add -A` (see Guardrails)
git commit -m "<message>"
```

**STOP before pushing.** See Guardrails → Deployment Approval.

---

## 4. Verified Infrastructure Facts

### Repository

| Property | Value |
|---|---|
| Local path | `/Users/markcartwright/Desktop/mgc-site-complete_1` |
| GitHub remote | `https://github.com/mgcglobalconsulting/mgc-site-complete_1.git` |
| Active branch | `main` |
| Build scripts | **None** — `package.json` has an empty `scripts` object |

### Netlify — PRIMARY PRODUCTION

| Property | Value |
|---|---|
| Live domain | `mgcglobalconsulting.com` |
| Publish directory | `.` (repository root) |
| Build command | *(empty)* |
| Functions directory | `netlify/functions` |
| Function bundler | esbuild |

**Netlify Functions (10 deployed):**

`booking-assistant.js` · `create-checkout.js` · `lead-intake.js` ·
`new-client-signup.js` · `payment-webhook.js` · `request-invoice.js` ·
`slack-events.js` · `slack-notify.js` · `trueassist.js`

API routes mapped in `netlify.toml`:

- `/api/chat` → `trueassist` (TrueAssist web chat; POST to send, GET to poll relayed replies)
- `/api/slack/events` → `slack-events` (Slack Events API request URL for thread relay)

### Vercel — SECONDARY MIRROR (static only)

| Property | Value |
|---|---|
| Project name | `mgc-site-complete_1-update` |
| Project ID | `prj_9xDoIEWeEJsyUInMiAVtpfsOTMTa` |
| Owner / team slug | `onedopestorys-projects` ("onedopestory's projects") |
| Production URL | `https://mgc-site-complete1-update.vercel.app` |
| Root directory | `.` |
| Output directory | `public` if it exists, else `.` — **`public/` DOES exist** |
| Framework preset | Other |
| Node version | 24.x |
| Created | 2026-09-30 |
| Local link state | **NOT LINKED** — no `.vercel/` directory present |

> **Naming trap:** the Vercel *project* is `mgc-site-complete_1-update`, but the local
> *folder* is `mgc-site-complete_1` (no `-update`). These intentionally differ. Historical
> docs that listed the local path as `.../mgc-site-complete_1-update/` were wrong and have
> been corrected. Always use the no-suffix path locally.

---

## 5. Known Divergences — Read Before Editing

These are live inconsistencies between the two deployments. Treat them as landmines.

### 5.1 Vercel mirror has no backend

Netlify serves 10 serverless functions. Vercel has **zero** function configuration. Every
dynamic feature — checkout, payment webhooks, lead intake, TrueAssist chat, Slack relay,
invoicing — **works on Netlify and is broken on Vercel.**

**Implication:** Netlify is the real production site. Vercel is a static preview only.
Never direct a client, a Stripe webhook, or a Slack request URL at the Vercel domain.

### 5.2 Root vs `public/` content drift

- Repository root: **23** `.html` files
- `public/`: **16** `.html` files

Netlify publishes from root (all 23). Vercel publishes from `public/` (only 16). Seven
pages exist on Netlify that are missing from the Vercel mirror.

**Implication:** any page edit must be applied to **both** the root copy and the `public/`
copy, or the two deployments drift further. Verify which pages are missing before assuming
a file exists in both.

### 5.3 Route tables are out of sync

`netlify.toml` and `vercel.json` define different route sets.

| Route | Netlify | Vercel |
|---|---|---|
| `/admin`, `/book`, `/privacy` | Yes | **Missing** |
| `/success`, `/ai-consulting`, `/ai-workshops`, `/automation`, `/crm-optimization`, `/systems-design`, `/retainer-support`, `/partner-success` | **Missing** | Yes |
| `/checkout`, `/thank-you`, `/membership`, `/services`, `/dashboard`, `/onboarding-assistant` | Yes | Yes |

**Implication:** adding a page requires editing **both** config files.

### 5.4 Production environment variables — `UNVERIFIED`

Last recorded as missing from Netlify production. **This record is ~4 months old and must
be re-confirmed in the Netlify dashboard before being acted on or reported to the client.**

Reported missing: `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `SUPABASE_WEBHOOK_SECRET` ·
`NOTION_API_KEY` · `NOTION_COMPANIES_DATABASE_ID` · `NOTION_CONTACTS_DATABASE_ID` ·
`NOTION_DEALS_DATABASE_ID` · `NOTION_PROJECTS_DATABASE_ID` · `NOTION_INVOICES_DATABASE_ID`

If genuinely still missing, live payments and CRM sync are broken. Escalate to Mark rather
than silently patching.

Verify with:

```bash
npx netlify env:list
```

### 5.5 Markdown and config files are publicly served

Netlify publishes from `.`, so **every file in the repository root is reachable over HTTP**,
including this document: `https://mgcglobalconsulting.com/ALEX.md`.

Already exposed by the same mechanism: `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `BRANDING.md`,
`README.md`, `Gemini.md`, `cloud.md`, `SYSTEM_CONTEXT_AND_ROLE_DEFINITION.md`, `2026-04-07.md`.

**This is why no document in this repository may ever contain a live secret** — doing so
publishes it to the open internet, not merely to Git history.

The repository already uses a block pattern for `ruvector.db`. The same pattern applied to
agent documentation would be:

```toml
[[redirects]]
  from   = "/*.md"
  to     = "/404.html"
  status = 404
  force  = true
```

Do not add this unilaterally — it is a production routing change. Propose it to Mark first.

---

## 6. Vercel Identifier Reference

Vercel exposes several ID-shaped strings that are frequently confused. Misclassifying one
as another causes either a broken config or a leaked credential.

| Identifier | Format | Purpose | Secret? |
|---|---|---|---|
| **User ID** | 24 chars, no prefix (`T9jbetua9ngkjF2RL6WlKksL`) | Identifies the account in REST API calls | **No** — safe to share |
| **Project ID** | `prj_` + 24 chars | Identifies one project | **No** |
| **Team ID** | `team_` + 24 chars | Identifies a team/org scope | **No** |
| **Access Token** | 24 chars, no prefix | **Credential granting full account control** | **YES — treat as a password** |

> **Critical ambiguity:** User IDs and access tokens are *visually identical* — both are
> 24-character prefix-less alphanumeric strings. They cannot be distinguished by format
> alone. Always confirm the source screen:
>
> - **Account Settings → Tokens** → access token (secret; rotate if exposed)
> - **Account Settings → General** → User ID (not secret)
>
> When in doubt, assume it is a token and handle it as a secret.

**MGC account values:**

- User ID: `T9jbetua9ngkjF2RL6WlKksL` *(not a secret; confirmed by Mark 2026-10-05)*
- Project ID: `prj_9xDoIEWeEJsyUInMiAVtpfsOTMTa`
- Team slug: `onedopestorys-projects`

**None of these need to be entered manually for normal development.** The CLI is already
authenticated as `onedopestory`; it resolves identity automatically. These values are only
needed for raw REST API calls or for CI systems that cannot run an interactive login.

### Linking the local folder to Vercel

The repository is currently unlinked. Linking is local, reversible, deploys nothing, and
consumes no build credits — it only writes `.vercel/project.json`.

```bash
cd ~/Desktop/mgc-site-complete_1
vercel link --yes --project mgc-site-complete_1-update --scope onedopestorys-projects
```

To unlink: `rm -rf .vercel`

### Toolchain status

Vercel CLI is **50.44.0**; current release is **62.2.0**. Flag the upgrade to Mark rather
than running it unprompted, since a global install affects every project on the machine:

```bash
npm i -g vercel@latest
```

---

## 7. Operational Guardrails

### Path Integrity

Always anchor file operations to `~/Desktop/mgc-site-complete_1`. Never target outdated
sync paths or orphan directories. Specifically, **`~/Desktop/mgc-site-complete_1-update/`
does not exist on disk** — that string is the Vercel project name only.

### Commit Hygiene

Resolve divergent branch histories and unrelated local merges **explicitly** before pushing
to production repositories.

- Stage files **by name**. Never `git add -A` or `git add .` — the repository root contains
  `.env.local`, and a mis-scoped stage risks committing live keys. (`.gitignore` covers
  `.env*`, but do not rely on it as the only safeguard.)
- Never amend a published commit. On a failed pre-commit hook, fix the cause and create a
  **new** commit — the failed commit never happened, so `--amend` would rewrite the
  *previous* one.
- Never use `--no-verify` to bypass hooks.
- Resolve merge conflicts. Never discard the other side with `checkout --theirs/--ours` as
  a shortcut.

### Deployment Approval — MANDATORY

**Always obtain explicit approval from Mark before any `git push`, `netlify deploy`, or
`vercel deploy`.** These are live client-facing environments and consume build credits.

Procedure:

1. Summarize exactly what will change and which environment is affected
2. Ask: *"Ready to push to GitHub / deploy to Netlify?"*
3. **Wait for an explicit yes.** Never proceed on assumption or inference
4. Approval is scoped to that one action — it does not carry forward to later deploys

> Rationale: deployments consume plan credits, and unauthorized pushes can exhaust limits
> mid-session. Applies to all projects under the `mgcglobalconsulting` GitHub org and the
> Vercel team account.

Deployment commands, for reference once approved:

```bash
npx netlify deploy --prod --dir .     # Netlify (primary production)
git push origin main                  # triggers Vercel auto-deploy
```

### Data Security

- Never expose raw live API keys, client payment instruments, or sensitive personal data in
  plain-text markdown, logs, or public commits.
- When inspecting environment files, print **variable names only** (`grep -oE '^[A-Z0-9_]+'`).
  Never `cat` an `.env` file into conversation output.
- Remember §5.5: markdown in this repository is **publicly served**, so "it's only in a doc"
  is not a safe assumption.
- If a credential is exposed in conversation or committed, say so immediately and recommend
  rotation. Do not quietly move on.

### Token Preservation

Cap session consumption at the **35% threshold**. On approach:

1. Write a progress checkpoint summarizing completed work, current state, and next actions
2. Surface the summary to Mark
3. Recommend a fresh session for continued work

### Escalation

Escalate to Mark rather than improvising when encountering:

- Missing production secrets (§5.4)
- Divergent Git history requiring a force operation
- Any change touching live payment flow or webhook endpoints
- Content drift between root and `public/` affecting a client-visible page
- Anything requiring a destructive command (`rm -rf`, `reset --hard`, `push --force`)

---

## 8. Quick Reference Card

```
LOCAL      ~/Desktop/mgc-site-complete_1          (branch: main)
GITHUB     mgcglobalconsulting/mgc-site-complete_1
NETLIFY    mgcglobalconsulting.com                 ← PRIMARY (functions work)
VERCEL     mgc-site-complete1-update.vercel.app    ← MIRROR (static only, no API)

BUILD      none — static HTML, package.json has no scripts
PREVIEW    npx netlify dev

EDIT A PAGE      → update root copy AND public/ copy
ADD A ROUTE      → update netlify.toml AND vercel.json
DEPLOY           → ask Mark first, every time
INSPECT SECRETS  → names only, never values
```

---

*Maintained for Alex. Facts verified 2026-10-05 against the live repository, Vercel API, and
deployment configuration. Items marked `UNVERIFIED` require re-confirmation.*

## Staff email routing (2026-10-26)

For email requests, start with [the staff email index](agentic-staffing/alex-trueassist-orchestrator/emails/README.md) and follow [the shared email instructions](agentic-staffing/alex-trueassist-orchestrator/emails/AGENTS.md). Each specialist owns an `emails/` folder. The shared `roles.json` maps current email display names to existing staff directories. Hermes cloud triggers and delivery are future integration work; see `AUTOMATION.md` for draft preparation, review, deduplication, and owner notifications.
