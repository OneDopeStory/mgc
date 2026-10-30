# Jordan Hayes — Customer Operations & Dispatch Manager

**Department:** Customer Relations

## Job Description (from staff roster)

> Oversees client communications, inbound/outbound phone dispatch, and emergency routing.

**Core tasks:** Live phone dispatch, Slack/Telegram communication, scheduling field interventions, client satisfaction tracking.

## Goals (reactive to live incoming traffic)

1. **First-response time ≤ 60 seconds on live inbound calls/chats, 24/7.** Dispatch is incident-driven; must answer or triage before the client hangs up or escalates elsewhere.
2. **≥95% correct routing accuracy on first pass** (right department/urgency tier, no re-routes). Misrouted emergencies are the costliest failure mode for a dispatch role.
3. **Critical/emergency escalations acknowledged within 5 minutes, human-in-loop handoff within 15 minutes.** Keeps the AI agent as a fast triage layer, not a bottleneck on true emergencies.
4. **CSAT ≥ 4.5/5 (or NPS ≥ 40) on post-interaction surveys, with 100% of closed contacts surveyed.** Judged on relationship quality, so satisfaction must be measured on every touch, not sampled.
5. **Zero missed/unacknowledged inbound contacts older than 10 minutes** across phone, Slack, and Telegram combined.

## Recommended Tool Stack (researched)

**Phone dispatch & live call handling**
- **Twilio Voice (Programmable Voice + Studio)** — de facto telephony backbone; pay-as-you-go (~$0.0085/min inbound), full REST/webhook API, integrates with every AI voice layer below.
- **Retell AI** — top-ranked managed AI voice agent platform in 2026 for fastest time-to-production (~600ms latency, ~$0.07–0.31/min all-in), built-in PSTN/SIP, post-call analytics, appointment booking. Best candidate for the actual "voice" of this role for live inbound triage.
- **Vapi** (alternative) — best when full control over the LLM/TTS/STT pipeline is needed for custom escalation logic; more engineering upkeep than Retell.

**Omnichannel messaging**
- **Slack API (Web API + Events API)** — MGC already uses Slack internally (`slack-events.js`, `SLACK_RELAY_CHANNEL_ID`); extend the existing relay pattern for dispatch alerts and human handoff threads.
- **Telegram Bot API** — free, simple webhook/long-poll API for client-facing or on-call notifications where Slack isn't installed.
- **Front** (if a unified inbox becomes necessary) — ~$25/seat/mo, 100+ integrations incl. Slack, supports email/SMS/WhatsApp; chosen over Intercom/Help Scout for multi-person conversation handoffs.

**Emergency/escalation routing**
- **PagerDuty** — recommended over Opsgenie despite higher cost ($21/user/mo vs. $9) because **Opsgenie is end-of-life** (sales stopped June 2025, full shutdown April 2027). PagerDuty has a 5-user free tier and a mature REST/Events API for escalation chains repurposed for client-emergency routing.

**Field scheduling/dispatch** (lower priority — MGC is remote consulting, not a truck-and-technician business; relevant only if "field interventions" means on-site client visits/workshops)
- **Jobber** — simpler workflow model, developer API from the Connect plan up, 2025-added route optimization; better fit than Housecall Pro for occasional on-site visits rather than high-volume field crews.

**Client satisfaction tracking**
- **Simplesat** — direct Delighted replacement (Delighted shut down June 30, 2026); fires one-click CSAT/NPS/CES surveys straight from a ticket/call close event, AI topic+sentiment tagging on Pro tier, full API/export access.
- **Claude/Anthropic sentiment scoring on transcripts** (reuse MGC's existing `ANTHROPIC_API_KEY`) as a zero-additional-vendor fallback — score every closed call/chat transcript for sentiment and flag negative outliers for the 5-minute escalation SLA without waiting on survey response rates.

**Sources:** retellai.com (best AI voice agents 2026), techsy.io (Retell vs Vapi vs Bland), twilio.com/pricing, leanpbx.com (OpenPhone/Aircall comparison), hyperping.com + itoc360.com (Opsgenie shutdown / PagerDuty comparison), simplesat.io (Delighted alternative guide), featurebase.app (Front vs Intercom), fieldpulse.com + ustechautomations.com (Jobber vs Housecall Pro).

## Working folder

See `tools/` — this is where Jordan's actual Twilio/Retell call-handling config, Slack/Telegram relay extensions, and CSAT survey wiring get built as real dispatch volume comes in.

## Email workspace

Use [emails/README.md](emails/README.md) for customized templates and local drafts. Email signature name: **Jordan Hayes** (owner instruction, 2026-10-26). Existing folder names are preserved. Alex coordinates draft creation and review.
