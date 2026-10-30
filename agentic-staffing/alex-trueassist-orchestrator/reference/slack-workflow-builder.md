# Slack Workflow Builder — reference for Alex's delegation layer

Status: reference only, nothing configured in MGC's Slack workspace yet. Captured 2026-10-29 at the owner's request — Alex should be able to delegate tasks to the right staff persona (Marcus, Elena, Jordan, Julian, David) for workflow efficiency, using Slack Workflow Builder as the execution layer once it's built.

## What this is

Slack's native no-code automation tool. Workflows are built and run *inside Slack's own UI/admin panel* (not in this codebase) — this repo can only **trigger** them (via links, webhooks, or connector steps) and **react** to their outputs, not define them directly.

- Available on paid Slack plans. By default all Full Members can build workflows; members/guests can use them.
- A workflow = trigger (how it starts) + steps (what it does), optionally with conditional branches.

## How workflows start

- **Link-based** — shared anywhere in Slack (channel, DM, canvas), click to run. Browsable via the Workflows/Automations tab, a channel's Workflows tab, or search.
- **Event-based** — emoji reaction, joining a channel, creating a channel.
- **Scheduled** — runs automatically on a cadence.
- **External trigger** — a workflow can be started from an external service (relevant for us: MGC's Netlify functions could call into Slack to kick one off, e.g. `slack-notify.js` or `lead-intake.js` triggering a workflow instead of just posting a message).

## Steps and connector steps

Steps accomplish tasks within a workflow. **Connector steps** call third-party services (e.g. QuickBooks, Notion, Google Calendar) — these require:
1. Authenticating the account with that service inside Slack
2. Possibly admin/app approval depending on workspace settings
3. Conditional branches can route differently based on step output

This is the natural tie-in to Alex's delegation model: a workflow step could route a task to a specific staff persona's channel/thread (Marcus for technical, Elena for biz-dev, Jordan for CustOps, Julian for accounting/QuickBooks, David for tech support) based on category, mirroring the routing job already described in Alex's own README (`≥95% correct first-route rate`).

## Management

- Creator + any added "workflow managers" can view activity (in-progress/completed/errors), edit/delete/reassign access, and export form responses.
- Admins separately control: who can build workflows, which connector/custom steps are allowed, whether external orgs can use workflows in Slack Connect conversations, and can view all published workflows from a dashboard.

## Where this fits MGC's stack (not yet built)

- **Trigger side**: `netlify/functions/slack-notify.js` and `lead-intake.js` already post to Slack (webhook/bot token). Extending them to call a workflow's *external trigger* endpoint (instead of/alongside a plain message) would let a lead or booking event kick off a multi-step Slack workflow — e.g. auto-create a QuickBooks invoice draft, auto-tag CRM stage, notify the right staff persona's channel.
- **QuickBooks connector step** ties into the still-incomplete QuickBooks credential setup (`QB_CLIENT_ID`/`QB_CLIENT_SECRET`/`QB_REFRESH_TOKEN`/`QB_REALM_ID` — see root `CLAUDE.md` open items). A Slack connector step authenticates independently of our Netlify env vars, so this doesn't block that rotation work, but both ultimately touch the same QuickBooks app.
- **Alex's delegation claim** ("Alex can delegate tasks to whoever for workflow efficiency") maps to: Alex (via `trueassist.js`) classifies/routes → a Slack workflow's conditional branch sends the task to the right persona's channel/thread → that persona (human or future sub-agent) picks it up.

## Open questions before building anything real

1. **Audience** — internal MGC ops only, or a capability offered to MGC's own clients? (asked, not yet answered as of 2026-10-29)
2. **Priority** — queued behind QuickBooks credential rotation and the Telegram/VPS work, or ahead of it? (asked, not yet answered)
3. Which specific process should the first real workflow automate? (e.g. new-lead routing, invoice approval, onboarding checklist)

Source: Slack Help Center, "Guide to Slack Workflow Builder" (pasted by owner, 2026-10-29).
