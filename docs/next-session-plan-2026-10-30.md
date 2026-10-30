# Next-session plan — captured 2026-10-30

Scoping only. Nothing in the "AI Employee Dashboard" section below is built — owner asked explicitly for a plan + key points to pick up next session, not implementation.

## What this session closed out
- **Netlify SSO 401 site-wide login wall — fixed.** Root cause was the team's "Default project visibility: Private for all projects" setting (not a password toggle, not in Netlify's public API). Owner overrode `mgc-global-consulting` to Public in the dashboard; confirmed live (`curl -I` now 200, was 401). `mgc-membership` override requested too — confirm it's done before relying on it.
- **QuickBooks client secret** — rotated in Intuit portal, old value removed from working-tree `.env.template`. History rewrite explicitly declined (low priority, secret already dead).
- **Unused Netlify site `loveandwellnesscoaching`** — permanently deleted at owner's request.
- **TrueAssist widget resized** — 360×500 → 320×440 (`assets/trueassist-widget.css`), owner said the open window was still too big.
- **Alex's staff-brain memory updated** — new `agentic-staffing/alex-trueassist-orchestrator/memory/concepts/staff-org-structure-and-reporting-2026-10-30.md` consolidates all 5 specialists' roles/abilities/responsibilities plus Alex's explicit oversight-and-report-to-Mark mandate; logged in `memory/decisions-log.md`.

## Carried-over open items (unchanged, see root `CLAUDE.md` "Current state & open items" for full detail)
- Full Netlify prod deploy decision (A: ship everything uncommitted, B: hold off) — still not answered.
- Possible git-link discrepancy (`build_settings.provider: "netlify-git"` pointing at `hgit.services-prod.nsvcs.net`) — contradicts the "manual deploy only" assumption, not reconciled.
- Re-test the Google OAuth client-portal "dead zone" now that the SSO gate is off — may be auto-fixed.
- Slack channel expansion (A: manual invite vs B: scope expansion) — still unanswered.
- VPS SSH / Alex Dispatch deploy — owner needs to personally SSH in with his key passphrase; not yet done.
- `mgc-membership` Netlify visibility override — confirm applied.

## New idea to scope: "AI Employee Dashboard"

Owner's ask (verbatim intent): a dashboard that tracks AI staff work in **real time**, writes completed work into a **database**, and mirrors that database to **Google Sheets** as a backup source of truth, "save as same file name to match." Visual reference supplied: a dark-theme HR/ops dashboard (Dribbble "Dazeboard" — sidebar nav, KPI tiles, a dual-line chart, an employee data table with avatar/role/status columns).

### Important: this likely already has a home — don't build a parallel system
`docs/command-center.md` (Command Center spec, built 2026-10-05) **already defines almost exactly this**:
- Section 3 "Staff and agents" — humans (rate, hours, labor cost, billable %, open tasks) and agents (model, runs, tokens, cost, approval rate, live/idle/off status).
- Section 5 "Projects and to-dos" — task cards moving `todo → doing → done`, i.e. real-time progress tracking per staff/agent.
- Backing tables already drafted (not yet applied): `mgc_staff`, `mgc_time_entries`, `mgc_model_usage`, `mgc_tasks`, `mgc_agent_events`, `mgc_intake_ideas`, in `supabase/migrations/20261005220000_command_center.sql`.

**First question for the owner next session:** is the "AI employee dashboard" idea (a) the same thing as Command Center's Staff/Agents + Projects sections, just needing the migration finally applied and the UI restyled toward the Dribbble reference, or (b) a genuinely separate, simpler surface (e.g. a standalone page, or a new Command Center tab) with different scope? Don't assume — this changes the whole next-session task list.

### What's genuinely new (not in the existing Command Center spec)
- **Google Sheets mirror.** Nothing in this codebase talks to Google Sheets today (only Google Calendar, via `GOOGLE_SERVICE_ACCOUNT_KEY_B64`). Would need: Sheets API scope added to the existing service account (or a new one), a write path (Netlify function or Supabase Edge trigger) that mirrors specific table(s) to specific sheet tabs, and a sync cadence (every write vs. batched).
- **"Save as same file name to match"** — ambiguous as stated. Most likely reading: each synced Supabase table gets a Google Sheet **tab** named identically to the table (e.g. `mgc_tasks` table → `mgc_tasks` tab), so the two stay traceable 1:1. Confirm this reading with the owner before building — could also mean something about exported report file names instead.
- **Visual restyle toward the Dribbble reference.** The reference uses purple/cyan on near-black with pill status badges and a left icon+label sidebar. Per `DESIGN-STANDARDS.md` and `BRANDING.md`, MGC's actual token set is abyss `#010C1A` / cyan `#00D4FF` / gold `#FFB347` (no purple) — adapt the *layout/information density* from the reference (KPI tiles, line chart, dense data table with status pills) rather than copying its color palette. Command Center's existing glass/beam visual system (`command-center-glass.css`) already matches this brand direction and the "ovals not sharp corners" preference the owner confirmed on 2026-10-28 — reuse it rather than inventing a second visual language.

### Suggested phased order for next session (pending the owner's answer above)
1. Get the owner's answer on "same dashboard vs. new" first — this gates everything else.
2. If extending Command Center: apply `20261005220000_command_center.sql` (owner-run, per that file's existing "not applied yet" note), populate `mgc_staff` with real hourly rates/hours, verify Staff/Agents + Projects sections render live data.
3. Scope the Google Sheets mirror as its own small spec (which tables, which tab names, write trigger, auth) — confirm "same file name to match" meaning first.
4. Only then touch visual styling — confirm which specific element needs the Dribbble-style treatment (the owner's past "beautiful effect/preview" message from 2026-10-28 is still unresolved/unclear too; worth asking both at once rather than guessing twice).
