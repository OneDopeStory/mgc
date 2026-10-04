# AI Employee Dashboard: Feature Spec

**Written for:** Mark (owner), and whoever builds the admin view.
**Preview:** `docs/design-preview/owner-dashboard-preview.html`. Sample data and a simulated feed. Not connected to Supabase or Google Sheets. Not deployed.
**Companion files:** `docs/owner-dashboard-kpi-spec.md` (business KPIs), `docs/owner-dashboard-visual-direction.md` (visual rules), `docs/agent-run-sync-spec.md` and `data/schema_agent_runs.sql` (data flow and schema, drafts).
**Date:** 2026-10-03

## 1. What each reference contributed

| Reference | Taken | Left out |
|---|---|---|
| SEDELA (glass, orange accent, pill top nav) | Pill top navigation, corner arrow buttons on KPI tiles, a request list with action buttons (used for the review queue), glass card depth | Orange accent (replaced with MGC gold), the course and withdrawal content |
| VANTA / Odama business analytics | Headline KPIs with a comparison window, a hover-driven overview chart (used for runs per day), a breakdown bar list | Financial figures and imagery |
| OnPoint Studio NeuroDash (agent project manager) | Project progress with completed, active, and upcoming legend. Donut for completion split. Recent-items list. Generate Report action. | Course and student data, names |
| Dazeboard (HR management) | Roster table with status pills and pagination. Activity heatmap by day and hour. | Payroll and employee personal data |
| SOLAR Digital (dark delivery pipelines) | Ring gauges for per-agent progress. Pipeline table with trend arrows. | The "AI delivery score," which has no defined formula for MGC |

## 2. Features, ranked by value to Mark

1. **Live progress per run.** Each run shows percent, step count, elapsed time, and the current step. Updates arrive through Supabase Realtime, not by page reload.
2. **Approval gates.** Anything that leaves the system (an email, an invoice, a publish) waits in the review queue. Approve, edit, or reject, and each decision is logged.
3. **Database as primary, Sheets as backup.** Every completed run is written to the database first and then mirrored to Google Sheets. The dashboard shows whether the counts match. Details in `docs/agent-run-sync-spec.md`.
4. **Full activity log per run.** Every step, warning, error, and approval is recorded. This is how Mark checks the work an agent did.
5. **AI employee roster.** One card per agent, with current status, progress ring, runs completed today, and last run time.
6. **Failure visibility.** A failed run shows the step where it stopped and the reason. Retry timing is shown. A manual retry button is planned for the build.
7. **Completed history.** Duration and sync status for each finished run. Filterable by agent and date.
8. **Throughput.** Runs per day for the last 14 days, from the database. An hour-by-day heatmap is planned for after launch.
9. **Business KPIs.** The client and revenue numbers from `docs/owner-dashboard-kpi-spec.md`, kept on the same page so Mark can see the work and its business result together.
10. **Export.** A link to the backup sheet, and a CSV download of runs. Planned for after launch.

### Left out until there is data to back them

- **Cost per run or token usage.** No measured usage exists yet. Per the Alex spec, do not estimate or invent it. Show "unavailable" until it is measured.
- **Success rate.** Needs a history of completed and failed runs first.
- **An "AI delivery score."** It has no defined formula.

## 3. Where each number comes from

| Panel | Source | Status |
|---|---|---|
| Runs today | `mgc_agent_runs`, count where `created_at` is today | Needs the schema |
| In progress | `mgc_agent_runs`, status = `running` | Needs the schema |
| Awaiting review | `mgc_agent_runs`, status = `needs_review` | Needs the schema |
| Completed (database) | `mgc_agent_runs`, status = `complete` | Needs the schema |
| Synced to Sheets | `mgc_agent_runs`, `sheets_synced_at` not null | Needs the schema and the sync function |
| Last sync | Latest `sheets_synced_at` | Needs the sync function |
| Live steps | `mgc_agent_run_events`, subscribed by Realtime | Needs the schema and the publication change |

## 4. Visual system

Same glass treatment and palette as `docs/owner-dashboard-visual-direction.md`. Status colors are fixed across the page: cyan for running, emerald for complete, gold for needs review, rose for failed. Raleway for large numbers, Plus Jakarta Sans for labels, JetBrains Mono for run IDs and timestamps. No emojis, and icons are inline SVG.

## 5. Build order (each step needs Mark's approval where marked)

0. **Confirm the live MGC Supabase project and check its current policies first.** This Claude account lists only one project, `OneDopeStory's Project`, which is not the project the site uses. The site's dashboard and admin pages point at the project in the archive notes (`bjnpibxaxlgvlzeegwnm`). Run this read-only query in that project's SQL editor and send back the output:
   `select tablename, policyname, cmd, roles, qual from pg_policies where tablename like 'mgc_%' order by tablename;`
   If any `mgc_` table has a policy with `qual = true` for `anon` or `authenticated`, the public anon key in the page source can read client rows. Treat that as urgent and fix it before anything else. (Approval for any change required.)
1. **Approve the schema draft** in `data/schema_agent_runs.sql`, then apply it in the confirmed project's SQL editor. (Approval required.)
2. **Set the owner role server-side.** Give Mark's user `app_metadata.role = 'owner'` through the Admin API or the service role. Sign out and back in. Then uncomment the owner-check policy and fill in `<OWNER_CHECK>`. The browser-side `ADMIN_EMAILS` list in `admin.html` is not a security boundary. (Approval required.)
3. **Add the tables to the Realtime publication.** Manual step. (Approval required.)
4. **Event ingestion endpoint.** A server-side function that writes run events. The service-role key stays on the server. Not in the preview.
5. **Sheets mirror.** A function that upserts by run key, plus the nightly reconcile. Use a dedicated service account for Sheets, not the Calendar one, so each credential has only the access it needs. Mark shares the backup sheet with that account. (Approval required.)
6. **Wire the preview to real queries** behind the owner check from step 2.
7. **Review, then deploy.** No deploy without Mark's approval.

## 5a. Security findings (from the schema review)

- **Admin email gate is not enforced.** `admin.html` checks an `ADMIN_EMAILS` list in the browser (lines 483 to 516). Anyone can read that list in the page source, and the check does nothing on the server. Anything the admin page reads depends on RLS, not on this check.
- **Admin policies are commented out in the repo.** In `data/schema_new_tables.sql`, the admin read and update policies are commented out. `data/schema_core_tables.sql` has per-client policies only. So either the admin page sees no rows, or admin policies exist in the live project and are not in the repo. Only the live check in step 0 can tell which.
- **Service-role key.** Not present in `admin.html` or `dashboard.html`, which is correct. It must stay server-side.
- **Sheets credential.** Reusing the Calendar service account would give the Sheets mirror access to Calendar, and the reverse. Use a separate account.

## 6. Open items for Mark

- The five AI employees in the preview (Site auditor, Invoice drafter, Booking reminders, Content drafter, CRM hygiene) are placeholders. Confirm the real list, or name the agents you want first.
- Which Google Sheet to use as the backup, and whether a new one should be created.
- Whether the review queue should cover only money and outbound email, or every external action.
- Whether to keep the simulated feed in the preview or remove it once real data is wired.
