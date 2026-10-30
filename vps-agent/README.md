# vps-agent — Grok Voice realtime bridge

DRAFT — scaffolded 2026-10-27, not deployed, not tested against a live xAI account.
See `../docs/grok-voice-architecture.md` for the full architecture and open blockers.

## What this is

This directory is a **separate deploy target**, not part of the Netlify site. It is NOT
built by `netlify.toml`, NOT deployed by `netlify deploy`, and has its own `package.json`.
It is meant to run as a **persistent Node process on the Hostinger VPS** (the same box
intended to host the Hermes Agent / "Alex" orchestrator work described elsewhere in this
repo), because the xAI realtime WebSocket for a live phone call must stay open for the
whole call — something a Netlify or Vercel serverless function cannot do.

Two entry points:

- `grok-voice-bridge.js` — the persistent process. Receives a call handoff from
  `netlify/functions/grok-voice-webhook.js`, opens the realtime WebSocket for that call,
  and bridges tool calls to `netlify/functions/grok-voice-tools.js`.
- `generate-voicemail-greeting.js` — a standalone, one-shot script that generates the
  static voicemail-style greeting audio. Needs only `XAI_API_KEY` — no VPS, no SIP trunk,
  no phone number. **Run this first** as a cheap, safe test of API connectivity before
  touching the live bridge.

## Required environment variables (names only — set these on the VPS, not in Netlify)

| Variable | Used by | Purpose |
|---|---|---|
| `XAI_API_KEY` | both scripts | Bearer auth to `wss://api.x.ai/v1/realtime`. |
| `XAI_WEBHOOK_SECRET` | *(Netlify side — `grok-voice-webhook.js`)* | Listed here for completeness; it is NOT used in this directory. It verifies the Standard Webhooks signature on the inbound-call webhook before the call ever reaches this VPS. |
| `VPS_BRIDGE_SHARED_SECRET` | `grok-voice-bridge.js` | Authenticates the handoff POST from `grok-voice-webhook.js`, and the outgoing tool-call POSTs to `grok-voice-tools.js`. Must be the exact same value configured in Netlify's environment for those two functions. |
| `MGC_SITE_URL` | `grok-voice-bridge.js` | Base URL of the live site (e.g. `https://www.mgcglobalconsulting.com`), used to reach `grok-voice-tools.js`. |
| `PORT` | `grok-voice-bridge.js` | Local HTTP port for the `/incoming-call` listener (default `8787`). Not from the list above, but worth setting explicitly on a shared VPS. |
| `GROK_VOICE_NAME` | both scripts | Optional. Overrides the placeholder voice id (`alloy`) used in `session.update` — xAI's actual available voice names were not confirmed in prior research. |

## What is explicitly NOT done yet

- **No VPS deployment.** This directory has not been copied to, or run on, the Hostinger
  VPS. There is no process manager (pm2/systemd) config, no reverse proxy / TLS, no
  `voice.` subdomain pointed at it.
- **No Hermes Agent wiring.** The relationship between this bridge and the Hermes Agent
  / Alex orchestrator setup described elsewhere in this repo (see
  `agentic-staffing/alex-trueassist-orchestrator/`) has not been built — they are
  currently independent.
- **No live phone number connected.** No SIP trunk (Twilio/Telnyx/Bandwidth/Plivo) has
  been registered or pointed at `sip:{number}@sip.voice.x.ai`. The number-portability
  question for the current hotline (`410-339-8375`) is still open — see
  `docs/grok-voice-architecture.md`.
- **The audio-capture event shape in `generate-voicemail-greeting.js` is a best guess.**
  `response.audio.delta` / `response.audio.done` are inferred from the OpenAI-Realtime-style
  event model the rest of this integration follows, not independently confirmed against
  xAI's docs or a live account. The script logs any unrecognized event type it receives,
  specifically so a first real run makes it easy to find the correct names if these are wrong.
- **No `XAI_API_KEY` exists yet** in this environment — none of this has been run.

## Manual setup steps left for the owner

1. Confirm an `XAI_API_KEY` and a spend cap on the xAI account (cost is trackable via
   `cost_in_usd_ticks` in every API response, per prior research).
2. **Done 2026-10-27** — tested live with `npm install` + `node generate-voicemail-greeting.js`
   (key via `vps-agent/.env`, gitignored). Produced a valid `output/alex-romero-greeting.wav`
   (24kHz mono PCM, 9.59s), confirmed with `afinfo`/`afplay`. The key used for that test was
   exposed in chat and should be rotated before production use.
3. Only after step 2 succeeds, plan the VPS deployment: copy this directory to the
   Hostinger VPS, `npm install`, set the full env var table above, and run
   `node grok-voice-bridge.js` under a process manager (pm2/systemd) behind HTTPS.
4. Set up DNS for a `voice.` subdomain pointed at the VPS if the bridge needs a public
   HTTPS endpoint (it currently listens on plain HTTP on `PORT` — add TLS termination,
   e.g. via nginx or Caddy, before exposing it).
5. **Owner confirmed 2026-10-27:** Alex Romero's voice line is a separate, **xAI-native**
   number — not the public MGC hotline (`410-339-8375`). xAI-native numbers are provisioned
   directly through xAI, so no carrier SIP trunk or number-porting step is needed here.
   Still open: confirm whether that number has actually been provisioned yet in the xAI
   account (a `phone_number_id`).
6. Configure the xAI webhook (event `realtime.call.incoming`) to point at
   `https://www.mgcglobalconsulting.com/.netlify/functions/grok-voice-webhook`, and set
   `XAI_WEBHOOK_SECRET`, `VPS_BRIDGE_URL`, and `VPS_BRIDGE_SHARED_SECRET` in Netlify's
   environment (not here).
