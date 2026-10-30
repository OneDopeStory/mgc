# Alex Call & Message Routing Architecture — Scoping

**Status: scoping only, nothing built.** Captures the owner's 2026-10-30 directive for how Alex should answer calls/messages, pull from a central knowledge directory, route to the right staff member, and relay messages back to Mark. Written before any code changes because several pieces below contradict what's actually deployed (see "Open contradiction").

## Owner's target design (as described 2026-10-30)

1. **One standard, cloud-readable directory for all MGC info** — `cloud.md` (repo root) becomes the index of company info, staffing roster, staff positions/roles, services, pricing, policies. Today `cloud.md` has a system/communications map but no staffing/roles section — that content currently only lives in `agentic-staffing/alex-trueassist-orchestrator/README.md` and the per-staff folders (`marcus-vance-cto/`, `elena-rostova-bizdev/`, `jordan-hayes-custops/`, `julian-vance-accounting/`, `david-kim-techsupport/`).
2. **Per-employee folder tree** — each staff member gets a consistent internal folder structure (same idea as the 9-pillar `memory/` tree just built for Alex) so Alex can predictably look up what a department knows/owns.
3. **Call handling** — caller dials Alex's number → "Alex Romero" (Grok Voice 3.0) answers, transcribes the request, and answers using the cloud.md + per-employee directory as its knowledge source. Today the voice tool schema only reaches Calendar/Supabase pricing/Slack escalate — it has no read path into `cloud.md` or `agentic-staffing/` at call time. That's new.
4. **Message relay** — any message Alex takes gets relayed back to Mark through **all** connected channels: Slack, Telegram, WhatsApp. Slack escalation exists and works today (`escalate_to_human` → `trueassist.js`-style Slack card). Telegram is planned/unwired for this path; WhatsApp is an existing connection but integration with this flow is unverified.
5. **Transfer-to-Mark rule (new, captured 2026-10-30):**
   - Alex's public number = the number shown on the website.
   - Mark's direct number = **240-962-9982** (new).
   - A caller asking to be transferred to Mark must reach 240-962-9982. Alex handles everything else.

## What already exists vs. net-new work

| Piece | Status |
|---|---|
| Grok Voice call-answering bridge (`vps-agent/grok-voice-bridge.js`) | Scaffolded 2026-10-27, **never run against a real call** (see `docs/grok-voice-architecture.md`) |
| `check_availability` / `book_session` / `get_pricing` / `escalate_to_human` tools | Written, reuse existing Calendar/Supabase/Slack logic, never hit by a real call |
| Alex reading `cloud.md` / `agentic-staffing/` during a live call | **Does not exist** — would need a new tool (e.g. `get_staff_directory` / `get_company_info`) added to `grok-voice-tools.js`'s schema |
| Live call transfer to a second number | **Does not exist** — needs confirmation that xAI's Grok Voice API supports transferring an in-progress call (vs. Alex taking a message and Mark calling back) |
| Telegram/WhatsApp fanout on escalation | **Does not exist** — Slack-only today |
| Per-employee memory folder tree (like Alex's new `memory/`) | Only built for Alex so far, not replicated to the 5 staff folders |

## Resolved (owner answers, 2026-10-30)

1. **Number called:** `410-339-8375` — this IS Alex's public number.
2. **Correction to the 2026-10-27 record:** `410-339-8375` and the Grok Voice line are **the same number, not separate**. Grok 3.0 provides the voice capability for it, and the number itself was provisioned/created through Grok (xAI). `docs/grok-voice-architecture.md` item 4 ("separate xAI-native number") is corrected below — superseded by this entry.
3. **What was wrong:** the call should be pulling the real-time website numbers plus the **$169.00 consultation fee**. (Note: this lines up with the existing open item in root `CLAUDE.md` — `booking-assistant.js` still defaults `SESSION_PRICE_USD` to 160 pending an unset `BOOKING_PRICE_USD` env var. The earlier-reported "750" figure doesn't match either $160 or $169 and remains unexplained — not assumed to be the pricing bug, don't force a connection.)
4. **"ISCM" methodology** — dropped. Not building anything under that name.
5. **Transfer-to-Mark behavior:** default is Alex handles the call. If the issue is urgent, Alex attempts to patch the caller through live to Mark (240-962-9982). Live-transfer capability via the Grok Voice/xAI API still needs confirming before this can be promised as built.
6. **Separate, pre-existing forwarding:** the owner says calls "can now forward through to me" already — an existing mechanism (likely carrier/number-level call forwarding, outside this repo's code) already reaches Mark. **Leave that alone** — do not touch or replace it while building the Alex-side transfer/patch-through logic.

## Still open

- Exact mechanism for Alex to patch a live call through to Mark on request (needs xAI Grok Voice capability check — not yet confirmed either way).
- Whether to replicate the 9-pillar `memory/` tree pattern to the other 5 staff folders (Marcus/Elena/Jordan/Julian/David) — not yet answered.
- Whether to also wire Telegram/WhatsApp into the escalation fanout (today Slack-only) — in scope per the original directive, not yet sequenced.

## Next steps

- Add a "Staffing & Routing" index section to `cloud.md` pointing at `agentic-staffing/` (not duplicating content, per this repo's existing pointer convention).
- Design the `get_staff_directory` / `get_company_info` tool for `grok-voice-tools.js` so Alex can answer from `cloud.md` + staff folders during a call, instead of only Calendar/Supabase pricing.
- Fix the `SESSION_PRICE_USD` default (160 → 169, or set `BOOKING_PRICE_USD`) since it directly affects what Alex quotes on calls.
- Decide and implement the live-transfer-to-Mark mechanism, once capability is confirmed.
- Wire Telegram/WhatsApp into the escalation fanout, reusing the existing Slack pattern, if confirmed in scope.
- Replicate the `memory/` tree pattern to the 5 staff folders, if confirmed.
