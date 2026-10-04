'use strict';
/**
 * MGC Global Consulting — Slack Events relay for TrueAssist
 * ─────────────────────────────────────────────────────────
 * POST /api/slack/events  (also /.netlify/functions/slack-events)
 * Slack Events API request URL. Subscribed bot event: message.channels
 * (message.groups if the relay channel is private).
 *
 * Flow: TrueAssist's escalate_to_team opens a thread in SLACK_RELAY_CHANNEL_ID and stores
 * its ts on the chat session. A reply in that thread is saved to mgc_chat_messages as an
 * 'agent' message, the session switches to 'human' mode, and the visitor's widget picks
 * it up on its next poll of GET /api/chat.
 *   !ai     hand the chat back to TrueAssist
 *   !close  end the chat
 *
 * Bot messages are ignored (this stops TrueAssist's own mirrored lines looping back),
 * except bots listed in SLACK_RELAY_ALLOWED_BOT_IDS, e.g. a Claude sub-agent's Slack app
 * that drafts or sends replies into the thread.
 *
 * Every request is verified with SLACK_SIGNING_SECRET (HMAC-SHA256, 5-minute window).
 */

const crypto = require('crypto');
const { db, hasServiceRole, slackApi } = require('../lib/leads');

const MAX_SKEW_SECONDS = 60 * 5;

function respond(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function header(event, name) {
  const headers = event.headers || {};
  return headers[name] || headers[name.toLowerCase()] || '';
}

function verifySlack(event, rawBody) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return false;
  const ts = header(event, 'x-slack-request-timestamp');
  const sig = header(event, 'x-slack-signature');
  if (!ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > MAX_SKEW_SECONDS) return false;
  const expected = `v0=${crypto.createHmac('sha256', secret).update(`v0:${ts}:${rawBody}`).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function allowedBot(botId) {
  const list = (process.env.SLACK_RELAY_ALLOWED_BOT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  return Boolean(botId) && list.includes(botId);
}

// Slack sends <@U123>, <url|label> and &amp; etc. Turn them into plain text for the visitor.
function slackToPlain(text) {
  return String(text || '')
    .replace(/<@[A-Z0-9]+>/g, '')
    .replace(/<(https?:[^|>]+)\|([^>]+)>/g, '$2 ($1)')
    .replace(/<(https?:[^>]+)>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim();
}

async function displayName(userId) {
  if (!userId) return 'MGC team';
  try {
    const { user } = await slackApi('users.info', { user: userId });
    const first = (user?.profile?.first_name || user?.real_name || '').split(' ')[0];
    return first ? `${first} at MGC` : 'MGC team';
  } catch {
    return 'MGC team'; // users:read scope missing or lookup failed
  }
}

async function setMode(session, mode) {
  await db(`mgc_chat_sessions?id=eq.${session.id}`, { method: 'PATCH', body: { mode } });
}

async function confirmInThread(session, text) {
  await slackApi('chat.postMessage', { channel: session.slack_channel, thread_ts: session.slack_thread_ts, text })
    .catch(err => console.error('Slack confirm failed:', err.message));
}

async function handleThreadReply(ev) {
  const channel = process.env.SLACK_RELAY_CHANNEL_ID;
  if (!ev || ev.type !== 'message' || !ev.thread_ts || ev.thread_ts === ev.ts) return; // not a thread reply
  if (channel && ev.channel !== channel) return;
  if (ev.subtype && ev.subtype !== 'bot_message' && ev.subtype !== 'thread_broadcast') return; // edits, deletes, joins
  if (ev.bot_id && !allowedBot(ev.bot_id)) return;

  const sessions = await db(
    `mgc_chat_sessions?slack_channel=eq.${encodeURIComponent(ev.channel)}&slack_thread_ts=eq.${encodeURIComponent(ev.thread_ts)}&select=id,mode,slack_channel,slack_thread_ts`
  );
  const session = sessions[0];
  if (!session) return;

  const text = slackToPlain(ev.text);
  const command = text.toLowerCase();
  if (command === '!ai') {
    await setMode(session, 'ai');
    await confirmInThread(session, 'TrueAssist is answering this chat again.');
    return;
  }
  if (command === '!close') {
    await setMode(session, 'closed');
    await confirmInThread(session, 'Chat closed. The visitor sees a closed notice on their next message.');
    return;
  }
  if (!text || session.mode === 'closed') return;

  const author = ev.bot_id ? 'MGC team' : await displayName(ev.user);
  await db('mgc_chat_messages?on_conflict=session_id,slack_ts', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates',
    body: { session_id: session.id, role: 'agent', content: text.slice(0, 4000), source: 'slack', author, slack_ts: ev.ts },
  });
  if (session.mode !== 'human') await setMode(session, 'human');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  const rawBody = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  if (!verifySlack(event, rawBody)) return respond(401, { error: 'Invalid signature' });

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return respond(400, { error: 'Invalid JSON' });
  }

  if (payload.type === 'url_verification') return respond(200, { challenge: payload.challenge });

  // Slack retries after 3 s. The first delivery already did the work (and inserts are idempotent).
  if (header(event, 'x-slack-retry-num')) return respond(200, { ok: true });

  if (payload.type === 'event_callback') {
    if (!hasServiceRole()) {
      console.error('slack-events: SUPABASE_SERVICE_ROLE_KEY not set; reply not relayed');
      return respond(200, { ok: true });
    }
    try {
      await handleThreadReply(payload.event);
    } catch (err) {
      // Still 200 so Slack does not disable the subscription; the error is in the function log.
      console.error('slack-events relay failed:', err.message);
    }
  }
  return respond(200, { ok: true });
};
