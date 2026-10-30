'use strict';
/**
 * DRAFT — scaffolded 2026-10-27, not deployed, not tested against a live xAI account.
 * See docs/grok-voice-architecture.md for open blockers before use.
 *
 * MGC Global Consulting — Grok Voice realtime bridge (persistent VPS process)
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the one piece of the Grok Voice integration that CANNOT run on Netlify/Vercel:
 * the xAI realtime WebSocket must stay open for the full duration of a phone call, and
 * serverless functions are torn down after a few seconds/minutes. This process is meant
 * to run persistently on the Hostinger VPS (see vps-agent/README.md for deploy notes).
 *
 * Flow:
 *   1. netlify/functions/grok-voice-webhook.js verifies the inbound-call webhook from xAI
 *      and POSTs {call_id, sip_headers} here, to POST /incoming-call (bearer-authenticated
 *      with VPS_BRIDGE_SHARED_SECRET).
 *   2. This process opens wss://api.x.ai/v1/realtime?call_id={call_id} and joins the call.
 *   3. It configures the session (Alex Romero persona, voice, tool schema, turn detection)
 *      via a `session.update` client event.
 *   4. When the model wants to call a tool, xAI sends `response.function_call_arguments.done`.
 *      This process POSTs to netlify/functions/grok-voice-tools.js (the same shared secret),
 *      gets the result, replies with a `conversation.item.create` (function_call_output) and
 *      then `response.create` so the model continues the turn with the tool result in hand.
 *   5. Every `conversation.item.created` event (the transcript) is logged to stdout for now.
 *      TODO (follow-up, once this is actually running): push these to Supabase
 *      (e.g. a new mgc_call_transcripts table, or reuse mgc_chat_messages' shape) the same
 *      way netlify/functions/trueassist.js logs chat turns with logMessage(). Not done here
 *      because there is no live call to validate the event shapes against yet.
 *
 * Env (names only, set on the VPS, NOT in Netlify):
 *   XAI_API_KEY               — xAI API key, used as `Authorization: Bearer` on the realtime WS.
 *   VPS_BRIDGE_SHARED_SECRET  — must match what grok-voice-webhook.js and grok-voice-tools.js expect.
 *   MGC_SITE_URL              — e.g. https://www.mgcglobalconsulting.com — where grok-voice-tools.js lives.
 *   PORT                      — local HTTP port for the /incoming-call listener (default 8787).
 *
 * NOTE ON VERIFICATION: the `session.update` / `response.function_call_arguments.done` /
 * `conversation.item.create` / `response.create` event names were confirmed against docs.x.ai
 * in prior research (OpenAI-Realtime-like event model). The exact JSON shape of each event's
 * payload below is a best-effort reconstruction from that research and has NOT been exercised
 * against a live xAI account. Treat field names as "likely right, verify on first real call."
 */

const http = require('http');
const WebSocket = require('ws');

const PORT = Number(process.env.PORT || 8787);
const XAI_API_KEY = process.env.XAI_API_KEY;
const SHARED_SECRET = process.env.VPS_BRIDGE_SHARED_SECRET;
const MGC_SITE_URL = process.env.MGC_SITE_URL || 'https://www.mgcglobalconsulting.com';
const TOOLS_ENDPOINT = `${MGC_SITE_URL}/.netlify/functions/grok-voice-tools`;

// ── Persona / instructions ──────────────────────────────────────────────────────
const INSTRUCTIONS = `You are Alex Romero, the AI dispatcher for MGC Global Consulting (enterprise AI strategy, automation, CRM optimization, systems design). You are answering a phone call.

Your job, in order:
1. Greet the caller warmly and briefly, and ask how you can help.
2. Figure out what they need:
   - If they want to book a strategy session: call check_availability before offering any time, never invent a time or price. Get their name and email (ask them to spell email addresses back if unclear on a phone line), confirm the exact time, then call book_session. Only tell them it's booked after book_session succeeds.
   - If they ask about pricing or services: call get_pricing and read back only what it returns. Never invent a price, discount, or package.
   - If they are frustrated, need something you can't help with, or explicitly ask for a person: call escalate_to_human with a one-sentence reason and, if you have it, a callback number.
3. Keep responses short and conversational — this is a phone call, not a chat window. One or two sentences per turn, plain spoken English, no lists, no emojis, no markdown.
4. Never give legal, tax, or credit advice. Offer a session with the team instead.
5. If you are unsure whether you heard something correctly (name, email, time), ask the caller to repeat or confirm it before using it in a tool call.`;

// Tool schema mirrors the four actions exposed by netlify/functions/grok-voice-tools.js.
// NOTE: the exact wrapper shape (`type: 'function'` + top-level name/description/parameters)
// matches the OpenAI-Realtime-style function-calling convention xAI's docs describe their
// event model after; double-check against a live session.update response before relying on it.
const TOOLS = [
  {
    type: 'function',
    name: 'check_availability',
    description: 'List open session times for the coming days. Call this before offering any time to the caller.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'integer', minimum: 1, maximum: 30 } },
    },
  },
  {
    type: 'function',
    name: 'book_session',
    description: 'Book one session. Use a start value copied exactly from check_availability, and only after the caller gave their name and email and agreed to that time.',
    parameters: {
      type: 'object',
      properties: {
        start: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        service: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['start', 'name', 'email', 'service'],
    },
  },
  {
    type: 'function',
    name: 'get_pricing',
    description: 'Get the current, approved price list. Call this before quoting any price.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'escalate_to_human',
    description: 'Notify the MGC team that a human needs to call this person back.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'One sentence on why a person is needed' },
        caller_name: { type: 'string' },
        callback_number: { type: 'string' },
      },
      required: ['reason'],
    },
  },
];

function sessionUpdatePayload() {
  return {
    type: 'session.update',
    session: {
      voice: process.env.GROK_VOICE_NAME || 'alloy', // placeholder voice id — confirm available voices against docs.x.ai
      instructions: INSTRUCTIONS,
      tools: TOOLS,
      turn_detection: { type: 'server_vad' }, // let xAI's server detect end-of-turn; confirm option name against live API
    },
  };
}

// ── Tool execution: call out to grok-voice-tools.js ─────────────────────────────
const ACTION_BY_TOOL_NAME = {
  check_availability: 'check_availability',
  book_session: 'book_session',
  get_pricing: 'get_pricing',
  escalate_to_human: 'escalate_to_human',
};

async function runTool(name, args) {
  const action = ACTION_BY_TOOL_NAME[name];
  if (!action) throw new Error(`Unknown tool requested by model: ${name}`);
  const res = await fetch(TOOLS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SHARED_SECRET}` },
    body: JSON.stringify({ action, ...args }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `grok-voice-tools ${res.status}`);
  return data;
}

// ── Per-call realtime session ────────────────────────────────────────────────────
function joinCall(call_id) {
  if (!XAI_API_KEY) {
    console.error(`[call ${call_id}] XAI_API_KEY not set — cannot join call.`);
    return;
  }
  console.log(`[call ${call_id}] joining realtime session`);
  const ws = new WebSocket(`wss://api.x.ai/v1/realtime?call_id=${encodeURIComponent(call_id)}`, {
    headers: { Authorization: `Bearer ${XAI_API_KEY}` },
  });

  ws.on('open', () => {
    console.log(`[call ${call_id}] websocket open; sending session.update`);
    ws.send(JSON.stringify(sessionUpdatePayload()));
  });

  ws.on('message', async (raw) => {
    let event;
    try {
      event = JSON.parse(raw.toString());
    } catch {
      console.error(`[call ${call_id}] received non-JSON frame, ignoring`);
      return;
    }

    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        console.log(`[call ${call_id}] ${event.type}`);
        break;

      case 'conversation.item.created':
        // Transcript line (user or assistant turn). Logged only, for now — see TODO at top of file.
        console.log(`[call ${call_id}] transcript item:`, JSON.stringify(event.item || event));
        break;

      case 'response.function_call_arguments.done': {
        // Expected shape (best-effort, OpenAI-Realtime-style): { type, call_id: toolCallId, name, arguments }
        // `call_id` here is the TOOL call id, not the phone call_id in this file's outer scope —
        // named toolCallId below to avoid confusing the two.
        const toolCallId = event.call_id;
        const toolName = event.name;
        let args = {};
        try {
          args = JSON.parse(event.arguments || '{}');
        } catch (err) {
          console.error(`[call ${call_id}] could not parse tool arguments for ${toolName}:`, err.message);
        }
        console.log(`[call ${call_id}] tool call: ${toolName}`, args);

        let output;
        try {
          output = await runTool(toolName, args);
        } catch (err) {
          console.error(`[call ${call_id}] tool ${toolName} failed:`, err.message);
          output = { error: err.message };
        }

        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: toolCallId,
            output: JSON.stringify(output),
          },
        }));
        // Unlike a `force_message` item (scripted TTS, no continuation), a function_call_output
        // is a normal conversational turn — the client must ask the model to continue.
        ws.send(JSON.stringify({ type: 'response.create' }));
        break;
      }

      case 'error':
        console.error(`[call ${call_id}] realtime API error event:`, JSON.stringify(event));
        break;

      default:
        // Audio deltas and other frequent events are intentionally not logged at full volume here.
        break;
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[call ${call_id}] websocket closed`, code, reason?.toString());
  });

  ws.on('error', (err) => {
    console.error(`[call ${call_id}] websocket error:`, err.message);
  });
}

// ── HTTP listener: receives the call handoff from grok-voice-webhook.js ─────────
const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/incoming-call') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const auth = req.headers.authorization || '';
  if (!SHARED_SECRET || auth !== `Bearer ${SHARED_SECRET}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    let parsed;
    try {
      parsed = JSON.parse(body || '{}');
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    const call_id = parsed.call_id;
    if (!call_id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing call_id' }));
      return;
    }

    // Ack immediately; the realtime join happens async so this HTTP handoff never blocks on it.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));

    joinCall(call_id);
  });
});

server.listen(PORT, () => {
  console.log(`grok-voice-bridge listening on :${PORT} (POST /incoming-call)`);
  if (!XAI_API_KEY) console.warn('XAI_API_KEY not set — calls will be accepted but cannot join the realtime session.');
  if (!SHARED_SECRET) console.warn('VPS_BRIDGE_SHARED_SECRET not set — /incoming-call will reject every request.');
});
