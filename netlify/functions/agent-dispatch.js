'use strict';
/**
 * MGC Global Consulting — Agent Dispatch Gateway
 * POST /.netlify/functions/agent-dispatch
 *
 * Internal relay: signs and forwards normalized MGC events to the Hermes/Alex
 * webhook server running at ALEX_DISPATCH_URL (agentdispatch.mgcglobalconsulting.com).
 *
 * Callers: other Netlify functions (lead-intake, trueassist, new-client-signup).
 * NOT called directly from the browser — this is a server-to-server relay.
 *
 * Env vars (set on Netlify):
 *   ALEX_DISPATCH_URL     Full webhook URL, e.g. https://agentdispatch.mgcglobalconsulting.com/webhook
 *   ALEX_DISPATCH_SECRET  Shared HMAC-SHA256 secret (same value as on the VPS)
 *   ALEX_DISPATCH_INTERNAL_SECRET  Required on this function to prevent unauthorized callers
 *
 * Wire:
 *   POST body: { event_type, event_id?, data: {...} }
 *   Returns:   { dispatched: true|false, event_id, event_type, error? }
 *
 * Non-blocking: callers await this but a failed dispatch never fails the original
 * form submission — the lead is already in Notion and Slack by the time this is called.
 */

const crypto = require('crypto');

const DISPATCH_URL = process.env.ALEX_DISPATCH_URL || '';
const DISPATCH_SECRET = process.env.ALEX_DISPATCH_SECRET || '';
const INTERNAL_SECRET = process.env.ALEX_DISPATCH_INTERNAL_SECRET || '';
const TIMEOUT_MS = 8000;

/**
 * Compute HMAC-SHA256 signature for the VPS webhook server.
 * Header: X-MGC-Signature: sha256=<hex>
 */
function sign(body) {
  return 'sha256=' + crypto.createHmac('sha256', DISPATCH_SECRET).update(body).digest('hex');
}

/**
 * Verify that a call to this Netlify function came from another internal function.
 * Uses a shared internal secret in the X-Internal-Secret header.
 */
function verifyInternalCaller(header) {
  if (!INTERNAL_SECRET) return false;
  if (typeof header !== 'string' || header.length < 8) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(INTERNAL_SECRET);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Forward one event to the Hermes VPS webhook server with a signed body.
 * Returns { dispatched, event_id, event_type, vps_status? }.
 */
async function forwardToVPS(eventType, eventId, data) {
  if (!DISPATCH_URL) {
    console.warn('[Agent Dispatch] ALEX_DISPATCH_URL not configured — skipping forward');
    return { dispatched: false, event_id: eventId, event_type: eventType, error: 'dispatch_url_not_configured' };
  }
  if (!DISPATCH_SECRET) {
    console.warn('[Agent Dispatch] ALEX_DISPATCH_SECRET not configured — skipping forward');
    return { dispatched: false, event_id: eventId, event_type: eventType, error: 'secret_not_configured' };
  }

  const payload = JSON.stringify({ event_type: eventType, event_id: eventId, data });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(DISPATCH_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-MGC-Signature': sign(payload),
        'X-Source': 'netlify-agent-dispatch',
      },
      body: payload,
    });
    clearTimeout(timer);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[Agent Dispatch] VPS responded', res.status, json);
      return { dispatched: false, event_id: eventId, event_type: eventType, error: `vps_${res.status}`, duplicate: json.duplicate };
    }
    console.log('[Agent Dispatch] Forwarded', eventType, eventId, '→ VPS', res.status);
    return { dispatched: true, event_id: eventId, event_type: eventType, duplicate: json.duplicate };
  } catch (err) {
    clearTimeout(timer);
    const reason = err.name === 'AbortError' ? 'timeout' : (err.message || 'network_error');
    console.error('[Agent Dispatch] Forward failed for', eventType, ':', reason);
    return { dispatched: false, event_id: eventId, event_type: eventType, error: reason };
  }
}

// ── Public helper — called by other Netlify functions ─────────────────────────

/**
 * dispatchEvent(eventType, data)
 *   Direct in-process call from another function in the same Netlify invocation.
 *   Use this instead of HTTP when both caller and this module are co-located.
 *
 *   eventType: one of the recognized event types (see VPS webhook_server.py)
 *   data:      the event payload object (name, email, etc.)
 */
async function dispatchEvent(eventType, data) {
  const eventId = [Date.now(), Math.random().toString(36).slice(2, 8)].join('-');
  return forwardToVPS(eventType, eventId, data);
}

exports.dispatchEvent = dispatchEvent;

// ── Netlify handler — for HTTP callers (future admin / test use) ───────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': 'https://www.mgcglobalconsulting.com' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Only allow internal callers via the shared secret
  const internalSecret = event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'];
  if (!verifyInternalCaller(internalSecret)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) };
  }

  const { event_type: eventType, event_id: callerEventId, data } = body;
  if (!eventType || typeof eventType !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'event_type required' }) };
  }

  const eventId = callerEventId || [Date.now(), Math.random().toString(36).slice(2, 8)].join('-');
  const result = await forwardToVPS(eventType, eventId, data || {});

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
};
