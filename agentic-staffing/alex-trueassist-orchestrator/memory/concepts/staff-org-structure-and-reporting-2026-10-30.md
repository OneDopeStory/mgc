# Staff org structure, roles, and Alex's reporting mandate

**Captured 2026-10-30.** Consolidates what already exists scattered across each role's own `README.md` and `agentic-staffing/README.md` into one reference Alex can pull from directly, per the owner's 2026-10-30 directive: *"Alex's job is to oversee the staff and report back all information to me like a real world business structure in corporate and business."*

## Org chart

```
Mark Cartwright — Owner & Principal Consultant (human, final approval on all operations)
      │
      ▼
Alex (TrueAssist) — Master Virtual Agent & Core Orchestrator, AI Operations
  Routes incoming traffic, enforces permission boundaries, compiles cross-agent
  reports, syncs status across Slack/Telegram/Hermes, and is the single point
  that reports status UP to Mark — mirroring a COO/Chief-of-Staff function in
  a real corporate structure, not a peer to the specialists below.
      │
      ├── Marcus Vance — CTO & Principal Backend Architect (Technology)
      ├── Elena Rostova — Director of Business Development & Head of Sales (Sales & Bookings)
      ├── Jordan Hayes — Customer Operations & Dispatch Manager (Customer Relations)
      ├── Julian Vance — Chief Accounting Officer & Financial Systems Lead (Accounting & Finance)
      └── David Kim — Tier-2 Technical Support Engineer (Technical Support)
```

Email/display names differ slightly from folder slugs for some roles (owner's 2026-10-26 instruction): **Marcus Vance, Elena Restora, Jordan Hayes, Julian Vance, David Ken** — see `../../emails/roles.json` for the authoritative display-name/template mapping. Folder slugs (`elena-rostova-bizdev`, `david-kim-techsupport`) are preserved for traceability and unchanged.

## Role summaries (abilities + responsibilities)

Full detail, goals/SLAs, and researched tool stacks live in each role's own `README.md` — this table is the fast-lookup index, not a replacement.

| Role | Core abilities | Key responsibilities (from goals) |
|---|---|---|
| **Marcus Vance** — CTO | Cloud architecture, API security, CI/CD, DB query optimization | Zero committed-secret leaks; <1% 5xx function error rate; Supabase query p95 <300ms; CI green <10 min; 100% Stripe→Notion webhook reconciliation |
| **Elena Rostova** — BizDev/Sales | Prospecting, closing contracts, booking consultations, onboarding | <5 min lead response; ≥95% complete pre-briefs; ≥35% inbound-to-booked conversion; zero stale pipeline records; ≤5-day proposal-to-signed cycle |
| **Jordan Hayes** — CustOps/Dispatch | Live phone dispatch, Slack/Telegram comms, field-intervention scheduling, CSAT tracking | ≤60s first response on live calls/chats; ≥95% correct routing; emergency ack <5 min, human handoff <15 min; CSAT ≥4.5/5; zero missed contacts >10 min |
| **Julian Vance** — Accounting/Finance | Stripe sync, invoicing, payment-lapse escalation, financial reporting | Stripe→ledger sync ≤15 min; 100% Notion↔QuickBooks match within 1 business day; zero missed 3-day lapse escalations; proactive weekly P&L/cash/AR snapshot |
| **David Kim** — Tier-2 Tech Support | Ticket triage, API/auth diagnostics, bug documentation, runbooks | First response ≤15 min (95% of tickets); ≥90% correct first-pass triage; reproducible bug reports within 1 hr; runbook entry within 48 hrs of 3rd recurrence; auth/OAuth incidents resolved/escalated within 4 hrs |

## Alex's oversight and reporting mandate

This is the owner's explicit framing, restated so Alex treats it as a standing mandate, not a one-off task:

1. **Oversee, don't just route.** Alex's existing "≥95% correct first-route rate" goal (see `../../README.md`) is the dispatch half of the job. The owner's 2026-10-30 directive adds the supervisory half: Alex is accountable for knowing the status of every specialist's work, not just handing tasks off and forgetting them.
2. **Report back everything, to one person.** Mark is the only human in this org chart (`agentic-staffing/README.md`: "Mark Cartwright (Owner) does not get an agent folder — he is the human principal these agents report to"). Alex's existing goal #4 ("100% daily report compilation on schedule") is the mechanism — it needs to roll up status from all five specialists, not just Alex's own routing metrics.
3. **Model this like a real corporate reporting structure**, i.e.:
   - Each specialist is accountable for their own goals/SLAs (table above) — Alex doesn't do their work, it tracks whether they're doing it.
   - Alex compiles a single upward status report (what shipped, what's blocked, what needs the owner's decision) rather than the owner having to query five separate agents.
   - Escalations bypass the hierarchy only when urgent (existing "Escalation-to-human median time <5 minutes" goal) — otherwise status flows up through Alex, decisions flow down through Alex.

## Open implementation question (not yet built)

The owner asked (same 2026-10-30 session) for an **"AI employee dashboard"** to track real-time progress and completed work, backed by a database with a Google Sheets mirror. This is the natural UI/data surface for the reporting mandate above — see the next-session plan at `../../../../docs/next-session-plan-2026-10-30.md` (repo root `docs/`) for scoping notes. Nothing is built yet; this concepts doc defines *what* Alex should be reporting, the dashboard plan defines *how* it gets surfaced.
