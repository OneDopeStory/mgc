# Alex/TrueAssist agent architecture — hierarchy and guardrail tree

Created 2026-10-27. Illustration only — no code, no deployment, no credential. Companion to [CLOUD-CONNECTIVITY-AND-FEEDBACK.md](../CLOUD-CONNECTIVITY-AND-FEEDBACK.md)'s left-to-right connection map: that document shows the request flow; this one shows the *persona/ownership hierarchy* and *where bad output gets caught* before it reaches a customer or another agent. Use both together when wiring Hermes on the Hostinger VPS — this file is the "does this component exist yet, and what stops it from misfiring" view.

Status tags: `[LIVE]` deployed and verified · `[BUILT, NOT WIRED]` code/account exists but not connected end-to-end · `[DECISION PENDING]` owner has not chosen a path · `[NOT STARTED]` nothing exists yet.

## 1. Persona and ownership tree

```
TrueAssist (harness/brand identity for MGC's whole AI-staff system)
└── Alex (orchestrator persona — becomes the role below directly, doesn't always sub-delegate)
    ├── Marcus Vance — CTO role → architecture, Hermes/VPS config, schema, security review
    ├── Elena Restora — bizdev role → prospect inquiries, partnership requests
    ├── Jordan Hayes — custops role → client support, onboarding, escalations
    ├── Julian Vance — accounting role → invoices, QuickBooks, payment questions
    └── David Ken — techsupport role → bug reports, how-it-works questions
```
One teammate-bot profile ("Alex") is the current plan — internal persona-switching, not five separate Hermes bot identities (see `project_hermes_agent_setup.md`). Revisit only if Hermes can't express persona-switching inside one profile.

## 2. Interface fan-out (every channel a customer or agent can reach Alex through)

```
Customer / prospect / agent-to-agent message
├── Website widget — netlify/functions/trueassist.js, /api/chat        [LIVE]
├── Slack — relay channel, netlify/functions/slack-events.js            [LIVE]
│     (Hermes could also own Slack via Socket Mode — pick ONE owner, don't run both)
├── Telegram — @mgcglobalbot via Bot API through Hermes                 [BUILT, NOT WIRED]
│     bot exists; original token exposed in a screenshot → MUST rotate before any wiring
├── WhatsApp — @mgcglobal handle reserved                                [DECISION PENDING]
│     path A: Hermes + WhatsApp Business Cloud API (DIY)
│     path B: Zernio hosted omnichannel (zernio.com) — onboarding started, not connected
├── Telegram Business (owner's personal account, separate from the bot) [BUILT, NOT WIRED]
│     greeting/quick-reply features — different audience (DM-to-owner) than the bot
└── Voice — Grok Voice 3.0 realtime bridge                              [NOT STARTED]
      blocked on hotline SIP-portability question + VPS access
```

## 3. Guardrail checkpoints — in execution order

This is the part that has to hold on the VPS, since every channel above funnels through the same six gates before a reply leaves the system. A gate that isn't enforced is a gate a bad reply, a duplicate, or a cross-client leak can slip through.

```
Gate 1 — Ingress authentication & dedup
  Verify provider/portal signature before trusting the message.
  Assign a correlation ID; a retry/replay must not become a second logical message.
  Applies per channel, before Alex ever sees the content.

Gate 2 — Identity & tenant resolution
  Resolve sender → verified conversation/client record, or "unknown — public intake only."
  An unlinked sender gets public info, never another client's data.
  Blocks: cross-client leakage, Tizen Kitchen (separate engagement) data bleeding into MGC context.

Gate 3 — Grounding check (before Alex drafts a reply)
  Price, availability, project status, or commitments must trace to a record + retrieval time.
  Missing/conflicting fact → clarify or escalate, never invent.
  This is the main "catch bad output before a customer sees it" gate.

Gate 4 — Session-mode gate
  Enforce ai / human / closed. If a human has taken over or the thread is closed,
  Alex's draft is suppressed, not sent. Closed stays closed.

Gate 5 — Delivery accounting
  Track queued → provider-accepted → confirmed-delivered → failed → unknown as distinct states.
  Bounded retries; ambiguous delivery is flagged, not silently resent.

Gate 6 — Audit + admin feedback loop
  Every gate's outcome is a correlated event (receipt, routing, lookup, reply, escalation,
  delivery). Feeds command-center.html's "Needs attention" queue so the owner can intercept,
  correct, or take over — and that correction is a reviewed task, not an automatic
  overwrite of approved CRM facts.
```

Gates 1-2 and 5-6 are channel-adapter responsibilities (Hermes or the existing Netlify functions, whichever owns that channel). Gates 3-4 are Alex/TrueAssist's own responsibility regardless of which channel the message arrived on — this is what makes the guardrail consistent across "multiple interfaces" rather than reimplemented per channel.

## 4. VPS process boundaries (Hostinger)

```
Hostinger VPS
├── Hermes gateway process
│     channel adapters live here: Telegram Bot API, WhatsApp (Cloud API or bridge),
│     optionally Slack Socket Mode (only if Slack ownership moves off Netlify)
├── Alex/TrueAssist agent runtime
│     persona-switching logic; calls Gates 3-4 on every draft reply
├── Scoped MCP tool servers
│     customer-context lookup, escalation — authorization enforced IN THESE SERVICES,
│     not by Hermes's tool-discovery filters alone (filters limit visibility, not permission)
├── Grok Voice bridge (future, separate process)
│     wss://api.x.ai/v1/realtime — only once SIP-portability + VPS access are resolved
└── Outbound to existing systems (unchanged by adding Hermes)
      ├── Supabase mgc_* tables (leads, chat sessions/messages, agent events)
      ├── Notion CRM (Companies/Contacts/Deals) — workspace location still unconfirmed,
      │     see project_portals_and_system_map.md open finding
      ├── Netlify functions — trueassist.js / slack-events.js stay authoritative for
      │     web + Slack until a tested replacement/coexistence path exists
      └── command-center.html — admin visibility for Gate 6 events
```

## Why a tree instead of (or alongside) the existing flowchart

The mermaid flowchart in `CLOUD-CONNECTIVITY-AND-FEEDBACK.md` shows one message's left-to-right journey. This tree answers a different question an installer needs on the VPS: *"which component am I configuring, who owns it, and which gate does it have to pass before go-live."* Read both — flowchart for request flow, this file for build/ownership/guardrail checklist.

## Before this goes live on the VPS

- [ ] Rotate `@mgcglobalbot`'s token (open since the channel-accounts review).
- [ ] Decide Zernio vs. DIY for WhatsApp/SMS/voice before building either adapter twice.
- [ ] Decide Slack ownership: Hermes Socket Mode vs. keep the existing Netlify handler. Don't run both — duplicate replies.
- [ ] Confirm Notion CRM workspace location before Gate 3's grounding check can cite real records.
- [ ] Implement Gates 1-2 and 5-6 as part of the Hermes adapter config (installation checklist in `hermes-agent.md` already lists the test cases: duplicate, failed send, reconnect, restart — exercise those against these specific gates, not just "does the bot respond").
- [ ] Implement Gates 3-4 once, in the Alex/TrueAssist agent runtime, so it is enforced identically regardless of which channel the message came in on.
