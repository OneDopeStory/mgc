# Alex (TrueAssist) — Master Virtual Agent & Core Orchestrator

**Department:** AI Operations

## Job Description (from staff roster)

> Backed by TrueAssist, manages all sub-agents, orchestrates permissions, compiles reports, and oversees automation.

**Core tasks:** Master agent coordination, permission management, spreadsheet compilation, cross-platform syncing (Slack, Telegram, Hermes Agent).

Alex is the entry point for all incoming traffic to MGC's systems (site chat, leads, bookings, support signals) and decides which specialist agent — Marcus (CTO), Elena (BizDev), Jordan (CustOps), Julian (Accounting), or David (Tech Support) — owns each task. Already exists in production as `netlify/functions/trueassist.js` (Claude Haiku-based chat, Supabase-backed pricing lookups, lead capture, Slack handoff).

## Goals (reactive to live incoming traffic)

1. **≥95% correct first-route rate** — inbound chat/lead traffic classified and handed to the right sub-agent on the first attempt. Routing accuracy is the orchestrator's single core function; misroutes directly cost lead conversion.
2. **Zero permission-boundary violations per month** — no sub-agent executes a tool/action outside its allowlisted scope (e.g. the accounting agent never calls a calendar-write tool). This is a security floor, not an optimization target.
3. **Cross-platform sync latency < 60 seconds** — a handoff or status update posted in one channel (Slack thread, Telegram, dashboard) appears in all synced channels within a minute.
4. **100% daily report compilation on schedule, zero missed cycles** — the roll-up (leads captured, bookings, escalations, sub-agent outcomes) is written to the spreadsheet-of-record reliably.
5. **Escalation-to-human median time < 5 minutes** for conversations flagged as needing a person — turns the existing Slack-handoff feature into an accountable metric.

## Recommended Tool Stack (researched)

**Orchestration framework**
- **Claude Agent SDK (subagent / orchestrator-worker pattern)** — top pick since TrueAssist is already Claude Haiku-based. The lead agent decomposes a request, spawns scoped subagents per department with restricted tool allowlists and separate system prompts, and aggregates results. Context isolation keeps each specialist's token usage out of Alex's own history.
- **LangGraph** — fallback/complement if the orchestration graph grows deterministic branching logic beyond prompt-level subagent dispatch; largest production footprint, built-in checkpointing for resumable multi-step state.

**Permission / role management**
- **MCP tool-level RBAC + default-deny allowlists** — bind each sub-agent identity to a narrow, explicit list of permitted tools, enforced before tool discovery (not just before invocation). The accounting sub-agent's MCP connection should never even *see* a booking-write tool.
- **Scoped API keys per sub-agent/service account** — never share one god-mode credential across Slack, Notion, Stripe, Google Calendar.

**Cross-platform sync**
- **Slack Web API + Telegram Bot API**, relayed through a Hermes-style gateway pattern (a single long-running process that normalizes inbound events from multiple platforms into one format and fans responses back out). MGC already has `slack-events.js` doing a one-way relay — extending it to a normalized multi-platform event bus satisfies the "Telegram, Hermes Agent" requirement in the job description.

**Reporting / compilation**
- **Notion** (already the CRM of record via `lead-intake.js`) as the spreadsheet-of-record target for daily roll-ups — lowest integration cost, env vars already exist.
- **Airtable** as a later option if richer cross-linked views or AI-field summarization is wanted; only adopt if Notion's reporting views prove insufficient.

**Durable / long-running workflow execution**
- **Vercel Workflow DevKit** (`workflow` SDK, useworkflow.dev) — built for exactly this failure mode: route → dispatch to sub-agent → wait for completion → compile report → sync to Slack/Telegram, surviving crashes and multi-minute-to-multi-day waits. Steps are plain async TypeScript (`'use workflow'` / `'use step'`), usage-based billing, ships a Slack-approval human-in-the-loop pattern out of the box.
  - **Caveat:** MGC's stack is Netlify Functions, not Vercel Functions. Adopting this means either running the orchestrator as a separate Vercel-hosted service alongside the Netlify site, or treating it as a Vercel-side pilot only — consistent with this repo's existing "Vercel is a testing/preview mirror" note. Worth a scoped pilot, not a wholesale migration.

**Sources:** vercel.com/docs/workflow, useworkflow.dev, truefoundry.com (multi-agent orchestration frameworks), getmaxim.ai (MCP RBAC for production agents), Claude Agent SDK subagent docs, Airtable 2026 release notes.

## Working folder

See `tools/` — this is where Alex's actual integration code (Slack/Telegram relay logic, routing classifier, report compiler) gets built as real tasks come in. Nothing is pre-built speculatively.

## Memory / knowledge base

[memory/README.md](memory/README.md) — the 9-pillar "Second Brain" ingestion tree (meeting notes, research, web clippings, daily notes, decisions log, workflows/SOPs, concepts, session memory) Alex routes captured information into. Built 2026-10-30; local-only until the VPS knowledge base can be synced (blocked on SSH access — see root `CLAUDE.md`). See [memory/second-brain-directive.md](memory/second-brain-directive.md) for the full routing rules.

## Communications reference and follow-up

For the planned Hermes installation, read [the official Hermes source guide](reference/hermes-agent.md) and [cloud connectivity and admin feedback brief](CLOUD-CONNECTIVITY-AND-FEEDBACK.md). They record the owner's Cloudflare/Tizen Kitchen, Slack, and WhatsApp context and define the next screenshot-led architecture discussion.

For incoming client, prospect, or partnership requests across the website portal, Slack, WhatsApp, Telegram, and Grok voice translation, start with [the TDLib reference](reference/telegram-tdlib-communications.md) and [the communications follow-up](COMMUNICATIONS-FOLLOW-UP.md). These document the existing local TrueAssist code and the next integration tasks. Deployment status must be verified separately; this reference does not establish that the proposed adapters or voice workflow are live.

## Delegation / workflow efficiency

Alex's routing job (section above — classify inbound traffic, hand off to the right sub-agent) is meant to extend into actual task delegation across Marcus, Elena, Jordan, Julian, and David for workflow efficiency. [Slack Workflow Builder reference](reference/slack-workflow-builder.md) captures how that could be executed once built — workflows are configured in Slack's own UI, this repo can only trigger/react to them. Reference only; nothing configured in the Slack workspace yet, and audience (internal vs. client-facing) and priority are still open questions.

## Email workspace

Start with [emails/README.md](emails/README.md) and [emails/AGENTS.md](emails/AGENTS.md). Route drafting requests to the staff member’s email folder using `emails/roles.json`. `emails/AUTOMATION.md` defines the future Hermes cloud handoff for automatic onboarding drafts, CRM promotion drafts, and Slack/Telegram/Gmail owner updates. This is prepared reference material; live automation is not configured.
