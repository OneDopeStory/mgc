# MGC Command Center: handoff summary

Last updated 2026-10-05. Read this before changing the dashboard.

## What the owner asked for
- A master, real-time "agentic" KPI dashboard for MGC's back office, with a heartbeat feel, in the MGC brand.
- It should track: staff, agentic staff (AI agents), models used, usage per employee, hourly rate for humans, projects and to-dos, and 4 new ideas for each customer intake, focused on that customer's own business.
- Follow-up: use the layout of the owner's reference image (a "CRM Hq Admin" Tailwind template). That means a sidebar, tinted stat tiles, line, grouped-bar and area charts, and "reality vs target". It should also show live information from Slack and from form intakes, and it should be interactive, not read-only.
- The owner wants low token use and a running summary of finished work.

## What exists now (local, uncommitted, not deployed)
| File | Purpose |
|---|---|
| `command-center.html` | Admin-only page with the sidebar shell and seven sections |
| `assets/command-center.css` | Styles. Tokens match `admin.html` and `BRANDING.md` |
| `assets/command-center.js` | Data loading, realtime, charts, inbox and actions. Exposes `window.CC` and fires `cc:event`, `cc:render`, `cc:view` |
| `assets/command-center-glass.css` | v3 "liquid glass" layer matching `~/Desktop/mgc-site-graphics` + DESIGN.md tokens |
| `assets/command-center-fx.js` | v3 effects: live integration hub, owner briefing, glass-crack section change, pointer spotlight |

Preview (demo data only): https://claude.ai/artifact/DubS7bEbwUGR8ByjdqhPhH

Local run: `python3 -m http.server 3456`, then open `/command-center.html?demo=1` for sample data, or `/command-center.html` to sign in.

## How it works
- **Sign-in:** Supabase email and password, limited to the same 3 admin emails as `admin.html`. The server enforces this with RLS through `public.mgc_is_admin()`.
- **Data:** each table is loaded with `select *` (newest 1000 rows), followed by one realtime channel for all 13 tables.
- **Sample fallback:** if a table is missing or empty, that card shows deterministic sample data with a gold **SAMPLE** tag, and a banner counts how many sources are sample. `?demo=1` (or `window.CC_DEMO = true`) uses sample data only, with no sign-in, and simulates events.
- **Heartbeat:** a canvas ECG beats about 60 times a minute at rest. Every realtime change adds a colored spike: Slack is violet, leads cyan, invoices gold. A mini ECG strip runs in the top bar, and cards glow when their data changes.

## v3 visual system (2026-10-06, from ~/Desktop/mgc-site-graphics)
- Glass panes: frosted gradient fill, a bevelled edge that runs cyan to gold, a pointer spotlight, and a border-beam light that circles a pane when its data changes.
- Background: DESIGN.md multi-radial bloom, a 72px grid, a drifting star field and a perspective circuit floor.
- Mission control hub (canvas): intake sources on the left (Slack, Forms, TrueAssist, Bookings, Invoices), agents on the right as chrome hex badges, and the MGC logo disc in the centre. Fiber bundles connect them. Real events send particles that warm to gold as they arrive at MGC, echoing the gold light streams in the graphics.
- Owner briefing: a plain-language list of what needs the owner, ranked critical → warning → info, each with a go-to button. It is computed from data, with no AI call.
- Section change: glass-crack lines spread from the click point (after the Broken-Glass reference), then panes slide in like glass sheets. Both are off under reduced motion.
- No generated imagery or type is used in the dashboard. The 21MB globe video was left out for page weight.

## Sections
1. **Command overview:**
   - Today's pulse tiles: revenue, new intakes, calls booked, Slack and agent actions, each compared with yesterday.
   - Line chart of intakes by source.
   - 8 KPI tiles with sparklines.
   - Heartbeat panel and activity feed.
   - Weekday bars of intakes against booked calls.
   - Agent and Slack activity over 24 hours.
   - Revenue against a monthly target. The owner types the target; it is kept in localStorage `cc-target`, per browser.
   - Client funnel and a mini approvals queue.
2. **Live inbox:** Slack, forms, questionnaires, TrueAssist chats, bookings and agent requests in one stream, with source chips and search. Item buttons make to-dos or approve requests.
3. **Staff and agents:**
   - Humans: rate, hours, labor cost, billable %, AI spend and open tasks.
   - Agents: model, runs, tokens, cost, approval rate and live, idle or off status.
4. **Models and usage:** a donut of spend by model, and stacked token bars per employee and agent.
5. **Projects and to-dos:** add a task, then tap a task to move it to the next column (todo → doing → done, blocked → doing, done → todo). Project progress bars sit below.
6. **Intake ideas:** 4 ideas per intake. Buttons: Make to-do, Mark reviewed, Dismiss.
7. **Revenue and approvals:** 12-week revenue, the approvals queue with Approve, Changes and Reject, and recent invoices.

## Data contract (what the page reads and writes)
**Reads:**
- `mgc_leads` and `mgc_bookings`
- `mgc_client_profiles` (`onboarding_status`)
- `mgc_invoices` (`amount_cents`, `status`, `due_date`, `paid_at`)
- `mgc_projects` (`progress`)
- `mgc_questionnaires` (`company`, `client_name`, `q1`…`q5`, `reviewed`)
- `mgc_approvals`
- `mgc_staff`, `mgc_time_entries`, `mgc_model_usage`, `mgc_tasks`, `mgc_agent_events`, `mgc_intake_ideas`

**Writes** (admin RLS; demo and sample rows change only the page):
- `mgc_approvals`: `status`, `decided_by`, `decided_at`
- `mgc_tasks`: insert, then `status` and `completed_at`
- `mgc_intake_ideas`: `status` (`reviewed` or `dismissed`)

**Slack** rows live in `mgc_agent_events` with these fields:
- `event` = `slack_message` or `slack_reply`
- `agent` = the poster's display name, or the agent name for bot posts
- `detail` = `#channel: text`

**Lead source mapping:** a source containing `trueassist` or `chat` counts as TrueAssist, one containing `book` counts as Bookings, and everything else counts as Forms.

## Ownership and what is still pending
- The SQL (6 new tables, policies, realtime, agent seed) and `intake-ideas.js` were handed to the **"Fix Supabase login and sync"** thread. They now live at `supabase/migrations/20261005220000_command_center.sql` and `netlify/functions/intake-ideas.js`, with pg_net triggers instead of dashboard webhooks. They are **not applied yet**. The owner runs them from that thread's setup guide. Don't run the SQL twice.
- That same thread does the **deploy**, including this page and its assets. Don't deploy separately.
- The owner still needs to enter human staff and hourly rates in `mgc_staff`. The 5 agents are seeded.
- Not built: a "set target" that is shared across viewers (it is per browser today), and editing staff from the page.

## Rules carried forward
No commit, push or deploy without explicit owner approval. Don't edit `netlify/`, `netlify.toml` or `supabase/`, which the other thread owns. Render text with `textContent`, not `innerHTML`. Use the brand tokens, with no emojis.
