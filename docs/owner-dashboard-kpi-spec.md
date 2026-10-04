# Owner Dashboard KPI Spec

**Written for:** Mark (owner), and whoever builds the admin view.
**Status:** Draft. Nothing built or deployed. Deploy needs Mark's approval.
**Date:** 2026-10-03

## 1. Where this lives

- **Owner view: `admin.html`.** It already loads `mgc_bookings`, `mgc_client_profiles`, `mgc_invoices`, `mgc_messages`, `mgc_projects`, `mgc_questionnaires`, and `mgc_uploads`. It already uses the status values listed below. Build the KPIs here.
- **Client portal: `dashboard.html`.** This is the client-facing page. Only client-appropriate data goes here.
- **Sprint 5 (`docs/reference/CLAUDE-archive-2026-10-03.md`)** mixes owner and client panels. Split it along this line before building.
- **Personal credit data does not go on any site page or function.** The project CLAUDE.md prohibits it, and `admin.html` and `dashboard.html` are both public URLs. Credit tracking stays in the local `marks-credit-fix` folder.

## 2. KPIs and data sources

Status values come from `admin.html`. Source: the `mgc_*` tables in `data/schema_*.sql`.

| KPI | Definition | Source | Status |
|---|---|---|---|
| Active projects | Count where status = `active` | `mgc_projects` | Ready |
| Paused projects | Count where status = `paused` | `mgc_projects` | Ready |
| Completed projects | Count where status = `complete` | `mgc_projects` | Ready |
| Invoices outstanding | Sum of amount where status = `pending` or `overdue` | `mgc_invoices` | Ready. Confirm the amount column name. |
| Overdue invoices | Count and sum where status = `overdue` | `mgc_invoices` | Ready |
| Paid this month | Sum where status = `paid` and paid date in current month | `mgc_invoices` | Needs a paid-date column. Confirm it exists. |
| Upcoming sessions | Count where status = `confirmed` and date is in the future | `mgc_bookings` | Ready |
| Pending booking requests | Count where status = `pending` | `mgc_bookings` | Ready |
| Sessions completed | Count where status = `completed` | `mgc_bookings` | Ready |
| New client profiles (30 days) | Count of `mgc_client_profiles` created in the last 30 days | `mgc_client_profiles.created_at` | Ready |
| Questionnaires submitted | Count | `mgc_questionnaires` | Ready |
| Uploads received | Count | `mgc_uploads` | Ready |
| Unread messages | Count of messages not yet read | `mgc_messages` | Needs a read-state column. Confirm it exists. |
| Deliverables completed | Count where status = `complete` | `mgc_deliverables` | Ready |

## 3. KPIs excluded until verified

These are in the Sprint 5 plan, but they should not appear on any page until they are backed by evidence.

- **Hours saved (`projects × 23`)**: the 23-hour average is one of the claims the business-context audit says needs owner evidence. Counting projects is not the same as measuring hours saved.
- **Cost avoidance (`hours × $85`)**: the $85/hour rate has no source in the repo. Remove it.
- **Automations live / "47+ automations deployed"**: no evidence yet. Count from `mgc_projects` only if you want an internal count, and label it that way.
- **Engagement score**: no definition exists. Define it first, or drop it.
- **Account balance**: no source table. Drop it unless it maps to `mgc_invoices`.

Showing unverified metrics to clients is also a marketing-claims problem, so this exclusion applies to the client portal too.

## 4. Suggested owner layout

1. **Top row:** active projects, outstanding invoices, overdue invoices, upcoming sessions.
2. **Middle row:** pipeline (pending bookings and new profiles, last 30 days) and paid-this-month.
3. **Bottom row:** recent messages and uploads, deliverables completed.

Keep the existing glassmorphism style and the palette tokens from `BRANDING.md`. Use inline SVG for icons. Do not use emojis.

## 5. Build order (smallest first)

1. Confirm the three open column questions: the invoice amount column, the paid-date column, and the message read-state column.
2. Add the Ready KPIs to `admin.html` as a single read-only panel.
3. Test locally with `python3 -m http.server 3456` or `npx netlify dev`. Use the real Supabase project.
4. Get Mark's approval before any deploy.
5. Only then decide on the full Sprint 5 visual redesign. Wait for the reference screenshot Mark said he would send.

## 6. Open items

- Reference screenshot from Mark (promised, not yet received).
- Confirm the three column names above.
- Decide whether the "Engagement score" KPI is worth defining.
