'use strict';
/**
 * DRAFT — scaffolded 2026-10-27, not deployed, not tested against a live xAI account.
 * See docs/grok-voice-architecture.md for open blockers before use.
 *
 * MGC Global Consulting — Grok Voice inbound-call webhook
 * ────────────────────────────────────────────────────────
 * POST /.netlify/functions/grok-voice-webhook  (point xAI's webhook config here)
 *
 * xAI calls this when a phone call arrives on the number wired to the SIP trunk
 * (sip:{number}@sip.voice.x.ai). This function's ONLY job is to:
 *   1. Verify the request really came from xAI (Standard Webhooks signature).
 *   2. Pull {call_id, sip_headers} out of the `realtime.call.incoming` event.
 *   3. Hand the call off to the persistent VPS bridge (grok-voice-bridge.js), which opens
 *      the long-lived realtime WebSocket. Netlify Functions are short-lived and CANNOT
 *      hold that connection themselves.
 *   4. Return 200 fast, regardless of whether the VPS handoff succeeded — a slow or
 *      failed relay should never cause xAI to retry/time out this webhook. Failures are
 *      logged loudly instead so a broken handoff is visible in Netlify function logs.
 *
 * Env (names only):
 *   XAI_WEBHOOK_SECRET      — Standard Webhooks signing secret from the xAI dashboard.
 *   VPS_BRIDGE_URL           — e.g. https://voice.mgcglobalconsulting.com/incoming-call (Hostinger VPS).
 *   VPS_BRIDGE_SHARED_SECRET — bearer token the VPS bridge also checks (see vps-agent/grok-voice-bridge.js).
 *
 * Signature verification uses the `standardwebhooks` npm package (added to package.json),
 * not a hand-rolled HMAC check — xAI's webhook-id/webhook-timestamp/webhook-signature headers
 * follow the Standard Webhooks spec (https://www.standardwebhooks.com/), which that package
 * implements correctly (including the base64 secret prefix and timestamp tolerance window).
 */

const { Webhook } = require('standardwebhooks');

const CORS = {
  'Access-Control-Allow-Origin': 'https://www.mgcglobalconsulting.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, webhook-id, webhook-timestamp, webhook-signature',
};

function respond(statusCode, body) {
  return { statusCode, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function header(event, name) {
  const headers = event.headers || {};
  return headers[name] || headers[name.toLowerCase()] || '';
}

// Returns the verified, parsed payload, or null if the signature is missing/invalid/misconfigured.
function verifyAndParse(event, rawBody) {
  const secret = process.env.XAI_WEBHOOK_SECRET;
  if (!secret) {
    console.error('grok-voice-webhook: XAI_WEBHOOK_SECRET not set; rejecting webhook');
    return null;
  }
  const webhookHeaders = {
    'webhook-id': header(event, 'webhook-id'),
    'webhook-timestamp': header(event, 'webhook-timestamp'),
    'webhook-signature': header(event, 'webhook-signature'),
  };
  if (!webhookHeaders['webhook-id'] || !webhookHeaders['webhook-timestamp'] || !webhookHeaders['webhook-signature']) {
    return null;
  }
  try {
    const wh = new Webhook(secret);
    // wh.verify throws on an invalid/expired signature and otherwise returns the parsed JSON payload.
    return wh.verify(rawBody, webhookHeaders);
  } catch (err) {
    console.error('grok-voice-webhook: signature verification failed:', err.message);
    return null;
  }
}

// Fire-and-log relay to the VPS bridge. Never throws past this function — a failed handoff
// must not change the 200 we send back to xAI, but it MUST be loud in the logs since a silent
// failure here means a caller gets dead air with no alert.
async function relayToVps(call_id, sip_headers) {
  const url = process.env.VPS_BRIDGE_URL;
  const secret = process.env.VPS_BRIDGE_SHARED_SECRET;
  if (!url || !secret) {
    console.error('grok-voice-webhook: VPS_BRIDGE_URL or VPS_BRIDGE_SHARED_SECRET not set; call_id', call_id, 'was NOT relayed to the VPS bridge. Caller will hear dead air.');
    return;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ call_id, sip_headers }),
    });
    if (!res.ok) {
      console.error('grok-voice-webhook: VPS bridge relay returned', res.status, 'for call_id', call_id, '— caller may hear dead air.');
    }
  } catch (err) {
    console.error('grok-voice-webhook: VPS bridge relay threw for call_id', call_id, ':', err.message, '— caller may hear dead air.');
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  const rawBody = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  const payload = verifyAndParse(event, rawBody);
  if (!payload) return respond(401, { error: 'Invalid or unverifiable webhook signature' });

  if (payload.type !== 'realtime.call.incoming') {
    // Unknown event type — ack it so xAI doesn't retry, but don't act on it.
    return respond(200, { ok: true, ignored: payload.type || 'unknown' });
  }

  const call_id = payload.data?.call_id;
  const sip_headers = payload.data?.sip_headers || [];
  if (!call_id) {
    console.error('grok-voice-webhook: realtime.call.incoming payload missing data.call_id');
    return respond(200, { ok: true });
  }

  // Deliberately NOT awaited-and-blocking: we want to ack xAI fast. But we DO await it here
  // (single short POST, same region) rather than fire-and-forget, so the Netlify function
  // doesn't get torn down mid-request before the relay attempt even starts. Any failure is
  // caught and logged inside relayToVps and never thrown.
  await relayToVps(call_id, sip_headers);

  return respond(200, { ok: true });
};
