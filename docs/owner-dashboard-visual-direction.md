# Owner Dashboard: Visual Direction

**Written for:** Mark (owner) and whoever builds `admin.html`.
**Companion to:** `docs/owner-dashboard-kpi-spec.md` (the KPI list and data sources).
**Status:** Direction only. Nothing built. Deploy needs Mark's approval.
**Date:** 2026-10-03

## 1. References reviewed

| Reference | What to take | What not to take |
|---|---|---|
| Dribbble 26677175, OnPoint Studio (NeuroDash), "AI Project Management Dashboard" | Left sidebar with grouped nav. Row of four KPI tiles, each with a big number and a delta pill. Multi-line progress chart with a legend. Donut for status split. Finance table with a Generate Report action. | Its numbers, course and student data, names, and layout copied as-is. |
| Dribbble 27665624, Odama, "VANTA Business Analytics Dashboard" | Headline KPI row with a comparison period ("vs. previous 17 days"). Revenue and profit chart with a hover tooltip. Revenue-by-channel bars. | Its financial figures, imagery, and branding. |
| Dribbble 26983160, SOLAR Digital (Kyrylo Soliar), "AI Dashboard Design" | Dark palette with glass-like cards and a single accent glow. Compact status tables with pill badges. Ring gauge for a single score. | Its fonts, illustration, and the "AI delivery score" concept, unless the owner dashboard needs it. |

Dribbble shots are design inspiration only. Their data is placeholder. Do not reuse their figures or assets.

## 2. Brand rules that override the references

- Background `--abyss #010C1A`. Accent `--cyan #00D4FF`. Premium accent `--gold #FFB347`. Positive deltas `--emerald #10B981`. Alerts `--rose #F43F5E` (from the Sprint 5 additions).
- Display type: Raleway, weight 800 or 900, for KPI numbers. UI type: Plus Jakarta Sans. Data values: JetBrains Mono.
- No chart libraries. Charts are inline SVG (`polyline`, `circle` with stroke-dashoffset, `rect`). This keeps the zero-build-step setup.
- No emojis. Icons are inline SVG.
- Every number on the screen comes from a Supabase query. No hard-coded figures.

## 3. Layout for `admin.html`

**Sidebar (collapsible, 265px when open):** Overview, Clients, Projects, Bookings, Invoices, Messages, Settings. Match the section names already in `admin.html`.

**Row 1: four KPI tiles.** Active projects, outstanding invoices ($), overdue invoices, upcoming sessions. Each tile has a large number, a label, and a delta pill vs. last week.

**Row 2:**
- Wide left panel: a line chart of pending and confirmed bookings per week, with a legend.
- Right panel: a donut of project status (active, paused, complete), with counts underneath.

**Row 3: four small tiles.** Paid this month, new client profiles (30 days), questionnaires submitted, uploads received.

**Row 4: two tables.**
- Upcoming confirmed sessions (date, client, service).
- Overdue invoices (client, amount, days overdue). Status pills use the existing admin values.

**Top bar:** page title, a search box, a notifications button, and an Add button for a new booking or client.

## 4. Data rules that keep the numbers honest

- A delta pill shows only when a comparison value exists. Until the "last week" query is written, show the number with no delta. Never display a made-up percentage.
- Metrics excluded in the KPI spec (hours saved, cost avoidance, automations count, engagement score, account balance) do not appear on this page.
- The paid-this-month and unread-message tiles wait on the column confirmations listed in the KPI spec.

## 5. States and responsiveness

- **Loading:** skeleton tiles with a shimmer, not spinners.
- **Empty:** each panel says what is missing and what would fill it. Example: "No upcoming sessions. Confirmed bookings appear here."
- **Error:** one line per panel, with a retry. A single failed query must not blank the whole page.
- **Phone width:** KPI tiles go two-up. The sidebar becomes a top menu. Tables scroll horizontally inside their own container, never the whole page. 16px side gutter.

## 6. Acceptance checks before any deploy

1. Every number traces to a named query in the KPI spec.
2. No hard-coded figures or dummy data remain in the shipped file.
3. No chart library is added and no build step is introduced.
4. Text contrast on the dark background meets WCAG AA. Check with a contrast tool.
5. The owner page does not expose client-private data to anyone who isn't signed in as the owner.
6. Tested at 390px and 1440px widths, and with the sidebar both open and collapsed.

## 7. Open items for Mark

- The reference screenshot you planned to send (still outstanding). If you want something closer to one of the three above, name which one.
- Confirm that "OnPoint Studio" is a name you want used anywhere. The reference page is credited to an OnPoint Studio designer; I have not used that name in the build.
- Confirm the three column names in the KPI spec before the build starts.
