'use strict';
/**
 * Shared helpers for TrueAssist (/api/chat), the Slack relay (/api/slack/events)
 * and the booking assistant. Lives outside netlify/functions so Netlify does not
 * deploy it as its own endpoint; esbuild bundles it into each function that requires it.
 *
 * Env (names only): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
 *   RESEND_API_KEY, LEAD_EMAIL_FROM, LEAD_EMAIL_REPLY_TO,
 *   SLACK_WEBHOOK_URL, SLACK_BOT_TOKEN, SLACK_RELAY_CHANNEL_ID, SITE_URL.
 */

const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bjnpibxaxlgvlzeegwnm.supabase.co';
// Publishable key is already public in dashboard.html; env var overrides it.
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Nj15e9wDVGVjBANsOdcTbg_AyXa1UJD';
const SITE_URL = process.env.SITE_URL || 'https://www.mgcglobalconsulting.com';
const PRICING_TTL_MS = 10 * 60e3;

// ── Small utilities ────────────────────────────────────────────────────────────
function clean(value, max = 200) {
  return typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '';
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email || '');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Slack mrkdwn treats <, > and & as control characters; escape so visitor text can't ping @channel or fake links.
function escapeSlack(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// ── Supabase (REST) ────────────────────────────────────────────────────────────
function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// New Supabase keys (sb_publishable_ / sb_secret_) are not JWTs and go on the apikey header only.
// Legacy JWT keys (eyJ...) also need Authorization: Bearer.
function keyHeaders(key) {
  return key.startsWith('eyJ') ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

// Server-side only. Bypasses RLS, so never pass client-controlled paths.
async function db(path, { method = 'GET', body, prefer } = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  const headers = { ...keyHeaders(key), 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.status === 204 ? null : res.json();
}

let pricingCache = { at: 0, rows: [] };

// Active services and prices, cached per warm function instance. Uses the public key (RLS: active rows only).
async function getServicePricing() {
  if (Date.now() - pricingCache.at < PRICING_TTL_MS && pricingCache.rows.length) return pricingCache.rows;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/mgc_service_pricing?select=slug,name,category,offer_type,price_usd,price_note,summary&active=eq.true&order=sort_order`,
      { headers: keyHeaders(SUPABASE_ANON) }
    );
    if (!res.ok) throw new Error(`pricing ${res.status}`);
    const rows = await res.json();
    pricingCache = { at: Date.now(), rows: Array.isArray(rows) ? rows : [] };
  } catch (err) {
    console.error('Pricing lookup failed:', err.message);
  }
  return pricingCache.rows;
}

function pricingForPrompt(rows) {
  if (!rows.length) return 'Pricing table unavailable right now. Do not quote prices; point the visitor to /services or a $169 strategy session at /book.';
  return rows
    .map(r => `- ${clean(r.name, 80)} (${clean(r.category, 30)}, ${clean(r.offer_type || 'project', 12)}): $${Number(r.price_usd).toLocaleString('en-US')} ${clean(r.price_note, 40)}. ${clean(r.summary, 200)}`)
    .join('\n');
}

// ── Welcome / confirmation email (Resend REST API) ─────────────────────────────
function welcomeEmailHtml(lead) {
  const first = escapeHtml((lead.name || '').split(' ')[0] || 'there');
  const booked = lead.booking
    ? `<p style="margin:0 0 16px">Your ${escapeHtml(lead.booking.service || 'strategy session')} is ${lead.booking.status === 'confirmed' ? 'confirmed' : 'requested'} for <strong>${escapeHtml(lead.booking.label)}</strong>${lead.booking.status === 'confirmed' ? '. A calendar invite is on its way.' : '. We will confirm the time within one business day.'}</p>`
    : `<p style="margin:0 0 16px">Thanks for reaching out about ${escapeHtml(lead.interest || 'working with MGC')}. A member of the team will reply within one business day.</p>`;
  return `<!doctype html>
<html><body style="margin:0;background:#010C1A;padding:32px 16px;font-family:Outfit,Helvetica,Arial,sans-serif;color:#E6F1FA">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#06182E;border:1px solid rgba(0,212,255,.25);border-radius:14px">
    <tr><td style="padding:28px 28px 8px">
      <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#00D4FF">MGC Global Consulting</div>
      <h1 style="margin:10px 0 18px;font-family:Raleway,Helvetica,Arial,sans-serif;font-size:24px;line-height:1.25;color:#FFFFFF">Hi ${first}, we have your ${lead.booking ? 'booking' : 'inquiry'}.</h1>
      ${booked}
      <p style="margin:0 0 16px">In the meantime, you can review services and pricing or pick a time that suits you.</p>
      <p style="margin:0 0 24px">
        <a href="${SITE_URL}/services" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#00D4FF;color:#010C1A;font-weight:700;text-decoration:none">View services</a>
        <a href="${SITE_URL}/book" style="display:inline-block;margin-left:8px;padding:12px 20px;border-radius:999px;border:1px solid #FFB347;color:#FFB347;font-weight:700;text-decoration:none">Book a session</a>
      </p>
    </td></tr>
    <tr><td style="padding:16px 28px 26px;border-top:1px solid rgba(255,255,255,.08);font-size:12px;color:#8BA3BC">
      You are receiving this because you contacted MGC Global Consulting at mgcglobalconsulting.com. Reply to this email to reach the team.
    </td></tr>
  </table>
</body></html>`;
}

async function sendWelcomeEmail(lead) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  if (!key || !from) return { skipped: 'RESEND_API_KEY or LEAD_EMAIL_FROM not set' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      // Same lead never gets two welcome emails if a retry re-runs this.
      'Idempotency-Key': `mgc-lead-${lead.id || sha256(lead.email + (lead.booking?.start || ''))}`,
    },
    body: JSON.stringify({
      from,
      to: [lead.email],
      reply_to: process.env.LEAD_EMAIL_REPLY_TO || undefined,
      subject: lead.booking ? `Your MGC session: ${lead.booking.label}` : 'We received your message — MGC Global Consulting',
      html: welcomeEmailHtml(lead),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// ── Slack ──────────────────────────────────────────────────────────────────────
function leadBlocks(lead) {
  const field = (label, value) => ({ type: 'mrkdwn', text: `*${label}:*\n${escapeSlack(value || '—')}` });
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: lead.booking ? 'New booking' : 'New TrueAssist lead' } },
    {
      type: 'section',
      fields: [
        field('Name', lead.name),
        field('Email', lead.email),
        field('Company', lead.company),
        field('Interest', lead.booking ? `${lead.booking.service} — ${lead.booking.label}` : lead.interest),
        field('Phone', lead.phone),
        field('Source', lead.source),
      ],
    },
  ];
  if (lead.message) blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*Summary:*\n${escapeSlack(lead.message.slice(0, 1500))}` } });
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `Received ${new Date().toUTCString()}${lead.id ? ` · lead ${lead.id}` : ''}` }] });
  return blocks;
}

async function postLeadToSlack(lead) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return { skipped: 'SLACK_WEBHOOK_URL not set' };
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `New lead: ${lead.name || lead.email}`, blocks: leadBlocks(lead) }),
  });
  if (!res.ok) throw new Error(`Slack webhook ${res.status}`);
  return { ok: true };
}

// Slack Web API with the bot token (needed for threads; incoming webhooks can't return a thread ts).
async function slackApi(method, payload) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error('SLACK_BOT_TOKEN not set');
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack ${method}: ${data.error}`);
  return data;
}

// ── Lead capture ───────────────────────────────────────────────────────────────
/**
 * Store a lead, then send the welcome email and Slack card. Downstream failures are
 * logged and reported in the result; they never throw past here.
 * input: { name, email, company, phone, interest, message, source, chatSessionId, booking }
 */
async function recordLead(input) {
  const lead = {
    name: clean(input.name, 120),
    email: clean(input.email, 254).toLowerCase(),
    company: clean(input.company, 120),
    phone: clean(input.phone, 40),
    interest: clean(input.interest, 200),
    message: typeof input.message === 'string' ? input.message.trim().slice(0, 2000) : '',
    source: clean(input.source, 60) || 'trueassist',
    booking: input.booking || null,
  };
  if (!validEmail(lead.email)) throw Object.assign(new Error('A valid email is required'), { status: 400 });

  try {
    const [row] = await db('mgc_leads', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        name: lead.name || null,
        email: lead.email,
        company: lead.company || null,
        phone: lead.phone || null,
        interest: lead.booking ? `${lead.booking.service} (${lead.booking.label})` : lead.interest || null,
        message: lead.message || null,
        source: lead.source,
        chat_session_id: input.chatSessionId || null,
      },
    });
    lead.id = row.id;
  } catch (err) {
    // Still notify the team so the lead isn't lost if Supabase is down or not configured.
    console.error('Lead insert failed:', err.message);
  }

  const [email, slack] = await Promise.allSettled([sendWelcomeEmail(lead), postLeadToSlack(lead)]);
  if (email.status === 'rejected') console.error('Welcome email failed:', email.reason.message);
  if (slack.status === 'rejected') console.error('Slack lead card failed:', slack.reason.message);

  const emailed = email.status === 'fulfilled' && !email.value?.skipped;
  const notified = slack.status === 'fulfilled' && !slack.value?.skipped;
  if (lead.id && (emailed || notified)) {
    const now = new Date().toISOString();
    await db(`mgc_leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      body: { ...(emailed && { email_sent_at: now }), ...(notified && { slack_notified_at: now }) },
    }).catch(err => console.error('Lead status update failed:', err.message));
  }

  return { id: lead.id || null, stored: Boolean(lead.id), emailed, slack_notified: notified };
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON,
  clean,
  validEmail,
  escapeSlack,
  sha256,
  hasServiceRole,
  db,
  getServicePricing,
  pricingForPrompt,
  sendWelcomeEmail,
  postLeadToSlack,
  slackApi,
  recordLead,
};
