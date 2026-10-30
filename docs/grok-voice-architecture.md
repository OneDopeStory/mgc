# Grok Voice (xAI) phone integration — architecture

DRAFT — scaffolded 2026-10-27, not deployed, not tested against a live xAI account.

## What this is

A phone-call equivalent of what `netlify/functions/lead-intake.js` already does for web
form submissions, and what `netlify/functions/booking-assistant.js`'s `chat` action does
for web-chat booking: a caller dials a number, "Alex Romero" (MGC's AI dispatcher persona,
voiced by xAI's Grok Voice 3.0 realtime API) answers live, transcribes the request, books
sessions via the existing Google Calendar booking logic, quotes pricing from the existing
Supabase pricing table, and escalates to a human via Slack when needed — the same backing
systems the web chat already uses, reused rather than duplicated.

The owner also asked for a generated voicemail-style greeting message as a standalone
deliverable, decoupled from the live-call path so it can be produced and reviewed with
just an API key, before any VPS/SIP/number work happens.

## Full flow

```
Caller dials number
        │
        ▼
Carrier SIP trunk (Twilio/Telnyx/Bandwidth/Plivo)
        │  sip:{number}@sip.voice.x.ai  (ports 5060/5061)
        ▼
xAI Grok Voice — receives the call, fires webhook event `realtime.call.incoming`
        │  POST, Standard Webhooks signature (webhook-id/webhook-timestamp/webhook-signature)
        ▼
netlify/functions/grok-voice-webhook.js   (Netlify — short-lived, fast ack)
  - verifies signature with XAI_WEBHOOK_SECRET (via the `standardwebhooks` npm package)
  - extracts { call_id, sip_headers } from the event payload
  - POSTs { call_id, sip_headers } to VPS_BRIDGE_URL, bearer-authenticated with
    VPS_BRIDGE_SHARED_SECRET
  - returns 200 to xAI immediately regardless of VPS relay success (logs loudly on failure)
        │
        ▼
vps-agent/grok-voice-bridge.js   (persistent Node process — Hostinger VPS, NOT serverless)
  - opens wss://api.x.ai/v1/realtime?call_id={call_id}, auth: Bearer XAI_API_KEY
  - sends session.update: voice, Alex Romero instructions, tool schema, turn_detection
  - on response.function_call_arguments.done: POSTs to grok-voice-tools.js, replies with
    conversation.item.create (function_call_output) + response.create
  - logs every conversation.item.created (transcript) to stdout (Supabase logging is a
    follow-up, once this is actually running against real calls)
        │  POST, bearer-authenticated with VPS_BRIDGE_SHARED_SECRET
        ▼
netlify/functions/grok-voice-tools.js   (Netlify — the tool-execution surface)
  - check_availability  → booking-assistant.js's getSlots()        (Google Calendar)
  - book_session        → booking-assistant.js's bookSession()      (Google Calendar + Supabase + Notion via lead-intake)
  - get_pricing         → netlify/lib/leads.js's getServicePricing()/pricingForPrompt()
  - escalate_to_human   → netlify/lib/leads.js's slackApi(), same card shape as trueassist.js's escalate()
```

Separately, and NOT part of a live call:

```
vps-agent/generate-voicemail-greeting.js   (one-shot script, run manually)
  - opens a plain wss://api.x.ai/v1/realtime?model=grok-voice-latest session (no call_id)
  - session.update with the Alex Romero voice/persona
  - sends a `force_message` item containing the greeting script (scripted TTS — no
    response.create follows, confirmed live 2026-10-27)
  - captures base64 audio deltas, wraps as WAV (24kHz mono 16-bit PCM — the deltas are raw
    PCM, requesting output_audio_format: 'mp3' had no effect), writes
    vps-agent/output/alex-romero-greeting.wav
```

**Ran successfully end-to-end 2026-10-27** against a live xAI account — produced a valid
9.59s WAV file, confirmed by macOS `afinfo`/`afplay`. This is the first real-world
validation of any part of this integration.

## Why the bridge has to live on the VPS, not Netlify/Vercel

The realtime WebSocket (`wss://api.x.ai/v1/realtime?call_id=...`) must stay open for the
entire phone call — potentially several minutes. Netlify Functions and Vercel Functions
are both short-lived request/response environments; neither can hold a persistent
outbound WebSocket connection across a multi-minute call. Netlify/Vercel can only handle:

(a) the initial webhook relay (verify signature, hand `call_id` off, return 200 fast), and
(b) the shared-secret-authenticated tool-execution callback the VPS calls into.

The actual realtime audio bridging has to run as a long-lived process — hence
`vps-agent/`, targeted at the Hostinger VPS mentioned elsewhere in this repo's notes on
the Hermes Agent / "Alex" orchestrator setup (see
`agentic-staffing/alex-trueassist-orchestrator/`), though that wiring has not been done.

## Environment variables by deploy target

These are **two different deploy targets** with **different environments** — a variable
set on Netlify is not automatically available on the VPS, and vice versa.

### Netlify (site environment — Site settings → Environment variables)

| Variable | Used by | Purpose |
|---|---|---|
| `XAI_WEBHOOK_SECRET` | `grok-voice-webhook.js` | Verifies the Standard Webhooks signature on the inbound `realtime.call.incoming` event. |
| `VPS_BRIDGE_URL` | `grok-voice-webhook.js` | Where to POST the `{call_id, sip_headers}` handoff (the VPS's public `/incoming-call` endpoint). |
| `VPS_BRIDGE_SHARED_SECRET` | `grok-voice-webhook.js`, `grok-voice-tools.js` | Must match the same-named var on the VPS. Authenticates both directions: webhook→bridge and bridge→tools. |

`grok-voice-tools.js` also reuses existing Netlify env vars already documented in the
project's root `CLAUDE.md` (Google service account vars for Calendar, Supabase vars,
`SLACK_RELAY_CHANNEL_ID`/`SLACK_BOT_TOKEN` for escalation) — nothing new there.

### VPS (Hostinger — set wherever `grok-voice-bridge.js` / `generate-voicemail-greeting.js` run)

| Variable | Used by | Purpose |
|---|---|---|
| `XAI_API_KEY` | both scripts | Bearer auth to the xAI realtime WebSocket. |
| `VPS_BRIDGE_SHARED_SECRET` | `grok-voice-bridge.js` | Must match the Netlify-side value. Authenticates inbound call handoffs and outbound tool calls. |
| `MGC_SITE_URL` | `grok-voice-bridge.js` | Base URL of the live site, to reach `grok-voice-tools.js`. |
| `PORT` | `grok-voice-bridge.js` | Local HTTP port for `/incoming-call` (default `8787`). |
| `GROK_VOICE_NAME` | both scripts | Optional override for the placeholder voice id used in `session.update`. |

Full detail and manual setup steps: `vps-agent/README.md`.

## Confirmed facts (live-tested 2026-10-27, via `generate-voicemail-greeting.js`)

These override the earlier best-guesses in this document and in code comments:

- Resolved model: **`grok-voice-3.0`** (requesting `grok-voice-latest` in the URL resolves to it).
- Default voice before any override: `xai_ara`.
- Real audio-output event names are **`response.output_audio.delta`** (base64 `delta` field)
  and **`response.output_audio.done`** — not `response.audio.*` as originally guessed by
  analogy to OpenAI's Realtime API. There's also a parallel
  `response.output_audio_transcript.delta`/`.done` stream (text transcript of what's being
  spoken) that this script currently ignores but could log/store later.
- `force_message` really does skip `response.create` — the server auto-sequences
  `response.created` → audio/transcript deltas → `response.done` on its own.
- `session.update`'s `output_audio_format` field is accepted (echoed back in
  `session.updated`) but **has no observed effect** on the realtime delta stream — the raw
  bytes were byte-for-byte identical whether set to `'mp3'` or omitted, and are not a valid
  MP3 either way. The deltas are raw PCM16, mono, 24kHz (duration math + macOS `afinfo`
  confirmed this once wrapped in a WAV header) — sample rate is not explicitly named in any
  session event, so if a future test sounds pitch-shifted, check this assumption first.
- A real `XAI_API_KEY` connects and bills successfully. **That specific key has been typed
  into chat/session context and should be rotated in the xAI dashboard before any
  production use**, same policy as the exposed Telegram bot token
  (`agentic-staffing/alex-trueassist-orchestrator/reference/channel-accounts-review-2026-10-27.md`).

## Current build status (as of 2026-10-27)

**Voicemail-greeting script is live-tested and working. Everything else (webhook, tools endpoint, call bridge) is still scaffolded only — not deployed, not tested against a real call.** Specifically:

- `package.json` has the `standardwebhooks` dependency added, but `npm install` has not
  been run as part of this work (per task constraints).
- `netlify/functions/booking-assistant.js` has an additive `module.exports` line
  (`getSlots`, `bookSession`, `SESSION_PRICE_USD`, `SERVICES`) so the new tools function
  can reuse it without reimplementing Google Calendar/Supabase logic. The existing
  `exports.handler` entry point is unchanged.
- `netlify/functions/grok-voice-webhook.js` and `netlify/functions/grok-voice-tools.js`
  are written and follow this repo's existing function conventions, but neither has been
  deployed or hit with a real request.
- `vps-agent/generate-voicemail-greeting.js` is live-tested and working (see "Confirmed
  facts" above). `vps-agent/grok-voice-bridge.js` (the actual call-answering bridge) uses
  the same now-confirmed event names, but has never been run against a real call_id/SIP
  call — the tool-calling half of the protocol (`response.function_call_arguments.done`,
  `conversation.item.create` with `function_call_output`) is still unverified.
- `vps-agent/` otherwise remains an unexercised scaffold beyond that one script: no VPS
  deployment, no process manager config, no reverse proxy/TLS, no Hermes Agent wiring.

## Still-open blockers

1. **VPS SSH/IP access.** No confirmed access details for the Hostinger VPS in this
   session — needed before any of `vps-agent/` can actually run persistently.
2. **Hermes Agent install progress.** The relationship between this bridge and the
   Hermes Agent / "Alex" orchestrator setup on that same VPS (see
   `agentic-staffing/alex-trueassist-orchestrator/`) is undefined; they are independent
   today.
3. **xAI API key + spend cap.** A key was tested live locally (`vps-agent/.env`, gitignored)
   2026-10-27, but it was typed into chat and should be rotated before production use —
   see "Confirmed facts" above. No spend cap has been set via the Management API yet. Cost
   is trackable per-request via `cost_in_usd_ticks` in xAI's API responses, per prior
   research.
4. **xAI-native number provisioning status — corrected 2026-10-30.** The 2026-10-27 note
   below (struck through) was wrong. Owner confirmed 2026-10-30: `410-339-8375` **is**
   Alex Romero's voice line — there is only one number, provisioned through xAI/Grok, and
   Grok 3.0 supplies the voice capability for it. This still resolves the earlier
   SIP-portability question the same way: xAI-native numbers are provisioned directly
   through xAI, not ported in via a carrier SIP trunk, so steps 5–6 under "Manual setup
   steps" in `vps-agent/README.md` (SIP trunk registration, carrier portability) do not
   apply. Still open: whether a `phone_number_id` is actually provisioned/active in the
   xAI account for `410-339-8375`, and whether the `realtime.call.incoming` webhook has
   been registered anywhere — neither has been confirmed.

   ~~Owner confirmed 2026-10-27 that Alex Romero's voice line is a separate, xAI-native
   number — not the public MGC hotline (410-339-8375).~~ (superseded above)
5. **DNS for a `voice.` subdomain.** Not yet created. Needed if the VPS bridge is exposed
   over public HTTPS (recommended over plain HTTP + raw IP) for the webhook handoff.

## Related reading

- `netlify/functions/booking-assistant.js` — Google Calendar + Supabase booking logic reused by `grok-voice-tools.js`.
- `netlify/lib/leads.js` — pricing and Slack helpers reused by `grok-voice-tools.js`.
- `netlify/functions/trueassist.js` — reference pattern for the `escalate_to_human` Slack-handoff shape.
- `vps-agent/README.md` — VPS-side setup, env vars, and manual steps.
- Root `CLAUDE.md` — hotline number change, SIP-portability question, and the broader
  "Grok Voice / AI call-center buildout" open item this scaffold fulfills part of.
