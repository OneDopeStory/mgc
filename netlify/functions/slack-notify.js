'use strict';
/**
 * MGC Global Consulting — Slack inquiry alerts
 * POST /.netlify/functions/slack-notify
 *
 * Triggered by: Supabase Database Webhook (INSERT) on the mgc_ tables below.
 * Posts one Block Kit card per new row, routed to the channel that owns the event
 * and signed as that channel's agent (see docs: slack-comms plan).
 *
 * Env:
 *   SLACK_NOTIFY_SECRET          shared secret; the webhook sends it in the x-webhook-secret header
 *   SLACK_BOT_TOKEN              bot token; posts with chat.postMessage
 *   SLACK_CHANNEL_MAP            JSON {"inquiries","clients","billing","outreach","approvals","ops"} → channel ID
 *   SLACK_INQUIRIES_CHANNEL_ID   fallback channel when the map has no entry
 *   SLACK_INQUIRIES_WEBHOOK_URL  fallback incoming webhook when there is no bot token (then SLACK_WEBHOOK_URL)
 */

const crypto = require('crypto');
const { AGENTS, channelFor, logSlackActivity } = require('../lib/slack-routing');

// Table → card title and the fields shown, in order. Anything not listed is never sent to Slack.
const TABLES = {
  mgc_leads:           { route: 'inquiries', title: 'New lead',                 fields: ['name', 'email', 'company', 'phone', 'interest', 'source', 'message'] },
  mgc_bookings:        { route: 'inquiries', title: 'New booking request',      fields: ['name', 'email', 'company', 'service', 'service_line', 'requested_date', 'message'] },
  mgc_client_profiles: { route: 'clients', title: 'New client profile',       fields: ['full_name', 'email', 'company', 'phone', 'industry'] },
  mgc_messages:        { route: 'clients', title: 'New client message',       fields: ['client_name', 'company', 'category', 'subject', 'message'] },
  mgc_uploads:         { route: 'clients', title: 'New client upload',        fields: ['client_name', 'file_name', 'file_size', 'description'] },
  mgc_questionnaires:  { route: 'clients', title: 'New business questionnaire', fields: ['client_name', 'company', 'q1', 'q2', 'q3', 'q4', 'q5'] },
};

const LABELS = {
  full_name: 'Name', service_line: 'Service line', requested_date: 'Requested date',
  file_name: 'File', file_size: 'Size', q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4', q5: 'Q5',
};

function label(key) {
  return LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

function escapeSlack(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatValue(key, value) {
  if (key === 'file_size' && Number.isFinite(Number(value))) return `${(Number(value) / 1024).toFixed(0)} KB`;
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return escapeSlack(text.length > 600 ? `${text.slice(0, 600)}…` : text);
}

function secretMatches(given) {
  const expected = process.env.SLACK_NOTIFY_SECRET;
  if (!expected || typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function buildCard(table, record) {
  const { title, fields } = TABLES[table];
  const shown = fields.filter(k => record[k] !== undefined && record[k] !== null && record[k] !== '');
  const short = shown.filter(k => !['message', 'description', 'q1', 'q2', 'q3', 'q4', 'q5'].includes(k));
  const long = shown.filter(k => !short.includes(k));

  const blocks = [{ type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } }];
  // Slack allows 10 fields per section.
  for (let i = 0; i < short.length; i += 10) {
    blocks.push({
      type: 'section',
      fields: short.slice(i, i + 10).map(k => ({ type: 'mrkdwn', text: `*${label(k)}:*\n${formatValue(k, record[k])}` })),
    });
  }
  for (const k of long) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${label(k)}:*\n${formatValue(k, record[k])}` } });
  }
  const when = record.created_at ? new Date(record.created_at) : new Date();
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `${table} · ${when.toUTCString()}` }] });

  const who = record.name || record.full_name || record.client_name || record.email || 'someone';
  return { text: `${title} from ${who}`, blocks, unfurl_links: false };
}

// Bot token + routed channel (chat.postMessage) when set, otherwise an incoming webhook.
async function postToSlack(message, route = 'inquiries') {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = channelFor(route);
  if (token && channel) {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ channel, username: AGENTS[route] || AGENTS.inquiries, ...message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) throw new Error(`Slack error: ${data.error || res.status}`);
    await logSlackActivity({ agent: AGENTS[route] || AGENTS.inquiries, route, text: message.text });
    return true;
  }
  const webhook = process.env.SLACK_INQUIRIES_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return false;
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error(`Slack responded ${res.status}`);
  await logSlackActivity({ agent: AGENTS[route] || AGENTS.inquiries, route, text: message.text });
  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  if (!secretMatches(event.headers['x-webhook-secret'])) return { statusCode: 401, body: 'Unauthorized' };

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { type, schema, table, record } = payload || {};
  if (type !== 'INSERT' || schema !== 'public' || !TABLES[table] || !record) {
    return { statusCode: 200, body: JSON.stringify({ skipped: true }) };
  }

  try {
    const posted = await postToSlack(buildCard(table, record), TABLES[table].route);
    if (!posted) console.error('[Slack Notify] No Slack destination configured');
    return { statusCode: 200, body: JSON.stringify({ posted }) };
  } catch (err) {
    console.error('[Slack Notify] Post failed:', err.message);
    // 200 so Supabase does not retry-storm; the row is already saved.
    return { statusCode: 200, body: JSON.stringify({ posted: false }) };
  }
};

exports.buildCard = buildCard;
exports.postToSlack = postToSlack;
