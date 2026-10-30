# MGC Global Consulting — Agentic Staffing Agency

This directory models MGC's staff roster (`MGC Staff List - Sheet1.csv`) as a team of autonomous AI agents, each reacting to **live incoming traffic** (inbound leads, support tickets, Stripe events, CI failures, calls) rather than a fixed schedule.

## Org structure

```
Mark Cartwright — Owner & Principal Consultant (human, final approval on all operations)
      │
      ▼
alex-trueassist-orchestrator/   Master Virtual Agent & Core Orchestrator
  Routes incoming traffic to the correct specialist agent below,
  enforces permission boundaries, compiles cross-agent reports,
  syncs status across Slack / Telegram / Hermes-style relay.
      │
      ├── marcus-vance-cto/            CTO & Principal Backend Architect
      ├── elena-rostova-bizdev/        Director of Business Development & Head of Sales
      ├── jordan-hayes-custops/        Customer Operations & Dispatch Manager
      ├── julian-vance-accounting/     Chief Accounting Officer & Financial Systems Lead
      └── david-kim-techsupport/       Tier-2 Technical Support Engineer
```

Mark Cartwright (Owner) does not get an agent folder — he is the human principal these agents report to, not an automated role.

## What's in each role folder

- **`README.md`** — job description (verbatim from the staff roster), 3-5 measurable goals grounded in reacting to real incoming traffic, and a researched top-tier tool stack (with reasoning + API/CLI/MCP operability notes, since every tool here needs to be drivable by an AI agent, not just a human with a mouse).
- **`tools/`** — empty workspace. This is where each agentic employee builds or wires up the actual tools/scripts/integrations from its `README.md` tool-stack recommendations as real work gets assigned to it. Nothing is pre-built speculatively; it fills in as each role takes on real incoming-traffic tasks.

## How to use this

1. Read a role's `README.md` for its mandate, goals, and recommended stack.
2. When a real task lands for that role (a lead, a ticket, a Stripe event, a CI failure), build the minimal integration needed in that role's `tools/` folder — don't pre-build the whole stack.
3. Alex (`alex-trueassist-orchestrator/`) is the entry point for all incoming traffic and decides which specialist folder/agent a task belongs to.

This is a planning/scaffolding layer — it does not change MGC's live site or functions. Wiring any of these agents into real production automation (new Netlify functions, new vendor accounts/API keys, Slack/Telegram bots) is a separate decision requiring explicit approval before any deploy or external signup, per this repo's deployment rules.

## Staff email workspaces (2026-10-26)

Use [Alex’s shared email index](alex-trueassist-orchestrator/emails/README.md). Each specialist has `emails/templates/` and `emails/drafts/`, with welcome, newsletter, update, policy, and role-specific copy. Email display names follow the owner’s latest instructions: Marcus Vance, Elena Restora, Jordan Hayes, Julian Vance, and David Ken. Older roster names and directory slugs are preserved for traceability. These files prepare drafts; cloud automation is not yet active.
