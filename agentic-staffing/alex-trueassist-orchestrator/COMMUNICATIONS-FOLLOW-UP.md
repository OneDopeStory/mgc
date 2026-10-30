# TrueAssist communications follow-up

Created: 2026-10-27. Owner: Alex / TrueAssist, with architecture work routed to the CTO role. Scope: follow-up to the [Telegram TDLib reference](reference/telegram-tdlib-communications.md), tied to the staff workspace currently being developed.

## Current evidence

- [x] Extracted the supplied Telegram documentation and linked it from root `AGENTS.md` and Alex's README.
- [x] Identified existing local chat, Slack relay, and Supabase migration files in the reference.
- [x] Verified the current xAI documentation lists Grok Voice 3.0; recorded voice versus text-model distinction.
- [ ] Verify deployed configuration and actual database schema. Existing local code and older README production claims do not prove the current deployment state.
- [ ] Verify existing Slack and WhatsApp connections reported by the owner, then build only the missing Hermes, shared-context, and translation pieces. Existing connections and completed Hermes integration are different states.
- [x] Added [Hermes installation references](reference/hermes-agent.md) and a [cloud connectivity / admin feedback brief](CLOUD-CONNECTIVITY-AND-FEEDBACK.md), including Tizen Kitchen's reported Cloudflare domain.
- [x] Review the owner's screenshots; record exact hostname, application, connection ownership, theme choice, and intended admin actions. See [channel-accounts-review-2026-10-27.md](reference/channel-accounts-review-2026-10-27.md) — covers WhatsApp username reservation, Zernio onboarding, Telegram bot creation (token must be rotated before use), owner Telegram ID, Telegram Business purchase, and a PKM reference slide.
- [x] Illustrate the persona/interface/guardrail hierarchy for the eventual Hermes VPS deployment. See [agent-guardrail-architecture-2026-10-27.md](reference/agent-guardrail-architecture-2026-10-27.md) — tree view of Alex's persona-switching, the six-channel fan-out, the six execution-order guardrail gates, and VPS process boundaries. Companion to the flowchart in `CLOUD-CONNECTIVITY-AND-FEEDBACK.md`, not a replacement.
- [x] **Built form-to-agent dispatch integration (2026-10-29).** See [vps/](vps/) for all artifacts:
  - `vps/webhook_server.py` — Python HTTP server on the VPS. Receives HMAC-signed POSTs, deduplicates by event ID, writes durable queue, invokes `hermes run --prompt` per event. Port 8080; expose via nginx → `agentdispatch.mgcglobalconsulting.com`.
  - `vps/alex-dispatch.service` — systemd unit to keep webhook server alive. Deploy to `/etc/systemd/system/`.
  - `netlify/functions/agent-dispatch.js` — Netlify-side signing relay. Exports `dispatchEvent(eventType, data)` for in-process calls from other functions. Also handles HTTP calls from authorized internal callers.
  - `netlify/functions/lead-intake.js` — updated to call `dispatchEvent('lead.submitted', ...)` as a fourth non-blocking parallel task alongside Notion/Slack/Telegram.
  - **Still needed before this is live:** deploy webhook_server.py to VPS; set `ALEX_DISPATCH_SECRET`, `ALEX_DISPATCH_URL`, `ALEX_DISPATCH_INTERNAL_SECRET` on Netlify; set `ALEX_DISPATCH_SECRET` in `/data/.env` on VPS; add DNS A record for `agentdispatch.mgcglobalconsulting.com`; configure nginx + TLS on VPS; set Anthropic API key in Hermes config so Alex can process events. Run verification checklist in `vps/README.md`.

## Next implementation tasks

| Priority | Task | Completion evidence |
|---|---|---|
| 1 | Confirm the first inbound use case and channel: client support, prospect inquiry, or partnership request. Preserve the recorded Hostinger VPS / Telegram Bot API plan; inventory existing Slack and WhatsApp connections. | A small decision record naming account scope, channel, routing owner, and the required capability. TDLib stays reference-only unless a concrete requirement changes this decision. |
| 2 | Inspect current chat migrations, session authorization, Slack thread mapping, and client/lead records. Design verified cross-channel identity linking. | Proposed fields and access rules; an unknown sender cannot obtain another client's records. Do not merge people by display name alone. |
| 3 | Define a common event record and storage mapping. | Record includes channel/account, external event/message/chat/thread IDs, internal conversation/contact links, direction, timestamp, content/media reference, language, and processing/delivery state. Label new fields as proposed until migrated. |
| 4 | Configure the Hermes Telegram Bot API adapter under Alex's tools workflow; pin the Hermes version and check supported behavior. | Scoped receive/reply works; authorization, restart recovery, supported message updates, duplicates, and send failures are exercised in a test environment. Do not assume arbitrary account history is available. |
| 5 | Reuse verified Slack/WhatsApp connection points and add missing Hermes integration after checking the provider's current documentation. | One reply owner per channel; provider-authenticated inbound events; mapped replies and delivery evidence. Preserve existing Slack handoff. A payment notification integration is not evidence of two-way client messaging. |
| 6 | Add Grok voice translation with explicit languages and bounded context retrieval. | Tested voice model/endpoint, audio formats, original/translated transcript pairing, human/text fallback, and per-language review results. Test recorded notes separately from realtime voice. |
| 7 | Connect routing to client support, prospect intake, and business-development/partnership handling. | Each scenario reaches the correct role with authorized context and can escalate to a human. Use `emails/roles.json` for current staff display names without renaming folder slugs. |
| 8 | Feed operational events and owner feedback into the existing command center, using the screenshot-confirmed theme. | Authenticated event timeline, actionable review queue, real/sample and freshness labels, and KPI calculations defined in the cloud brief; no live totals computed from truncated browser lists. |

These are local follow-up tasks, not scheduled reminders or messages sent to staff. Implementation can refine this sequence around the first concrete use case.

## Acceptance checks for the future implementation

- [ ] A website request and a Telegram message link only after identity/conversation ownership is verified; an unlinked visitor can still submit a prospect or partnership inquiry.
- [ ] Duplicate events and retries create one logical inbound message; reply mirroring does not create loops. A successful provider acceptance is distinguished from confirmed delivery.
- [ ] Human takeover prevents automatic replies; closed conversations remain closed. Preserve the existing `ai`, `human`, and `closed` session behavior.
- [ ] The agent retrieves only the relevant client's permitted records. Slack/Telegram/WhatsApp content cannot grant itself tool permissions or change routing policy.
- [ ] A failed channel adapter or voice provider does not block unrelated channels. Failed deliveries are visible and retryable without duplicate sending.
- [ ] Voice tests include different source/target languages, unclear audio, names, amounts, and dates. Original transcripts remain distinguishable from translations and generated replies.
- [ ] Secrets, TDLib state, and private media stay outside the static site and source control. Define retention/deletion handling before retaining client audio or importing history.
- [ ] Live configuration and any end-to-end sending/deployment are performed only within explicit authorization under the repository's existing rules.

## Handoff to the next Codex agent

Read the reference, inspect current files and applicable instructions, then take the first unresolved task. Update this file with changed paths, test results, remaining decisions, and whether the result is local, configured, or deployed. A checked box requires evidence. Do not treat this reference as a credential, a database connection, or permission to contact a client.
