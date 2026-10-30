'use strict';
/**
 * DRAFT — scaffolded 2026-10-27, not deployed, not tested against a live xAI account.
 * See docs/grok-voice-architecture.md for open blockers before use.
 *
 * MGC Global Consulting — Grok Voice tool-execution endpoint
 * ────────────────────────────────────────────────────────────
 * POST /.netlify/functions/grok-voice-tools
 * Headers: Authorization: Bearer <VPS_BRIDGE_SHARED_SECRET>
 * Body:    { action: 'check_availability'|'book_session'|'get_pricing'|'escalate_to_human', ... }
 *
 * Called by vps-agent/grok-voice-bridge.js whenever the live Grok Voice realtime session
 * emits a `response.function_call_arguments.done` event for one of Alex Romero's tools.
 * This endpoint does the actual work (Google Calendar, Supabase, Notion, Slack) by reusing
 * the existing booking-assistant.js and netlify/lib/leads.js code — it does not reimplement
 * any of that integration logic.
 *
 * Mirrors the { action: '...' } dispatch pattern already used in booking-assistant.js, and
 * the escalate() Slack-handoff shape already used in trueassist.js (see escalate_to_human below).
 *
 * This endpoint is NOT meant for browsers: it is locked to a shared secret, not CORS/origin,
 * because its only caller is the VPS bridge process, never site JS.
 *
 * Env (names only):
 *   VPS_BRIDGE_SHARED_SECRET — must match the bearer token the VPS bridge sends.
 *   SLACK_RELAY_CHANNEL_ID, SLACK_BOT_TOKEN — for escalate_to_human (same vars trueassist.js uses).
 */

const { getSlots, bookSession, SESSION_PRICE_USD, SERVICES } = require('./booking-assistant');
const { getServicePricing, pricingForPrompt, slackApi, escapeSlack } = require('../lib/leads');

function respond(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

function authorized(event) {
  const secret = process.env.VPS_BRIDGE_SHARED_SECRET;
  if (!secret) return false;
  const header = event.headers?.authorization || event.headers?.Authorization || '';
  return header === `Bearer ${secret}`;
}

// ── Tool implementations ───────────────────────────────────────────────────────

async function checkAvailability(input) {
  const { mode, slots } = await getSlots(input?.days);
  return {
    mode,
    price_usd: SESSION_PRICE_USD,
    // Keep the payload small and speakable — the voice model turns this into spoken sentences,
    // it doesn't need the full slot list a web widget would render.
    slots: slots.slice(0, 10).map(s => ({ start: s.start, label: s.label })),
  };
}

async function bookSessionTool(input) {
  // bookSession() re-validates name/email/service/start server-side; voice input is never trusted
  // any more than chat/web input is. No clientId — voice callers are not signed into the portal.
  return bookSession(
    {
      start: input?.start,
      name: input?.name,
      email: input?.email,
      service: SERVICES.includes(input?.service) ? input.service : input?.service,
      notes: input?.notes,
      service_line: 'Grok Voice phone call (Alex Romero)',
    },
    null
  );
}

async function getPricing() {
  const rows = await getServicePricing();
  return { price_list_text: pricingForPrompt(rows) };
}

// Mirrors trueassist.js's escalate(): posts a Slack card to the relay channel so a human can
// call the caller back. Voice calls have no chat session to attach a thread to, so this is a
// simpler one-shot notification rather than an ongoing thread relay.
async function escalateToHuman(input) {
  const channel = process.env.SLACK_RELAY_CHANNEL_ID;
  if (!channel || !process.env.SLACK_BOT_TOKEN) {
    return { ok: false, error: 'Live handoff is not configured; tell the caller the team will call back and take a number.' };
  }
  const reason = typeof input?.reason === 'string' ? input.reason.slice(0, 300) : 'Caller asked for a person';
  const callback_number = typeof input?.callback_number === 'string' ? input.callback_number.slice(0, 40) : '';
  const caller_name = typeof input?.caller_name === 'string' ? input.caller_name.slice(0, 120) : '';
  await slackApi('chat.postMessage', {
    channel,
    text: `Grok Voice handoff: ${reason}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: 'Phone call — human needed' } },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Caller:* ${escapeSlack(caller_name || 'Unknown')}\n*Callback number:* ${escapeSlack(callback_number || 'Not captured')}\n*Reason:* ${escapeSlack(reason)}`,
        },
      },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `Alex Romero (Grok Voice) — ${new Date().toUTCString()}` }] },
    ],
    unfurl_links: false,
  });
  return { ok: true, note: 'Team notified in Slack. Tell the caller someone from MGC will follow up.' };
}

// ── Entry point ────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
  if (!authorized(event)) return respond(401, { error: 'Unauthorized' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return respond(400, { error: 'Invalid JSON' });
  }

  try {
    switch (body.action) {
      case 'check_availability':
        return respond(200, await checkAvailability(body));
      case 'book_session':
        return respond(200, await bookSessionTool(body));
      case 'get_pricing':
        return respond(200, await getPricing());
      case 'escalate_to_human':
        return respond(200, await escalateToHuman(body));
      default:
        return respond(400, { error: 'Unknown action' });
    }
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error('grok-voice-tools error:', err.message);
    return respond(status, { error: status === 500 ? 'Something went wrong handling that request.' : err.message });
  }
};
