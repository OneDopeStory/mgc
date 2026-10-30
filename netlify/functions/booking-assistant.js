'use strict';
/**
 * MGC Global Consulting — Booking Assistant
 * POST /.netlify/functions/booking-assistant
 *
 * Actions (JSON body):
 *   { action: 'slots', days? }                               -> open session times
 *   { action: 'book', start, name, email, service, notes? }  -> books one exact slot
 *   { action: 'chat', messages: [{ role, content }] }        -> AI assistant (uses the tools below)
 *   { action: 'upcoming', days? }  + Authorization: Bearer <supabase token>, admin-only
 *                                                             -> real upcoming Google Calendar events,
 *                                                                for the CRM Overview "Calendar" widget
 *
 * Source of truth: Google Calendar (GOOGLE_CALENDAR_ID). Apple Calendar and Notion Calendar
 * read from that Google account. If Google is not configured, bookings are saved as requests
 * (logged to Notion via lead-intake) and the team confirms them.
 */

const crypto = require('crypto');
const { recordLead, db, hasServiceRole, SUPABASE_URL, SUPABASE_ANON } = require('../lib/leads');

const ALLOWED_ORIGINS = [
  'https://www.mgcglobalconsulting.com',
  'https://mgcglobalconsulting.com',
  'http://localhost:8888',
];
const SITE_URL = process.env.SITE_URL || 'https://www.mgcglobalconsulting.com';
const MODEL = process.env.BOOKING_MODEL || 'claude-sonnet-5-5';
const SERVICES = ['Strategy Session', 'AI Consulting', 'AI Workshop', 'Automation', 'CRM Optimization', 'Systems Design', 'Retainer Support'];
const SESSION_PRICE_USD = Number(process.env.BOOKING_PRICE_USD || 160);
const WEEKDAYS = [1, 2, 3, 4, 5]; // Monday–Friday (0 = Sunday)

// Same whitelist admin.html / crm.html already gate on client-side. The 'upcoming'
// action returns real client names/times off the calendar, so unlike 'slots' (public
// open-time data) it needs this server-side check — a Supabase session alone isn't enough.
const ADMIN_EMAILS = ['markatmgc@gmail.com', 'admin@mgcglobalconsulting.com', 'mgcglobalconsulting@gmail.com'];

function config() {
  return {
    tz: process.env.BOOKING_TIMEZONE || 'America/New_York',
    startHour: Number(process.env.BOOKING_START_HOUR || 8),
    endHour: Number(process.env.BOOKING_END_HOUR || 20),
    slotMinutes: Number(process.env.BOOKING_SLOT_MINUTES || 60),
    minNoticeHours: Number(process.env.BOOKING_MIN_NOTICE_HOURS || 24),
    daysAhead: Math.min(Number(process.env.BOOKING_DAYS_AHEAD || 14), 30),
  };
}

// ── Rate limit (per function instance; a soft guard, not a hard quota) ─────────
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60e3);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function respond(statusCode, origin, body) {
  return {
    statusCode,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}
function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// ── Time zone helpers (no dependencies) ────────────────────────────────────────
function partsIn(ms, tz) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const o = {};
  for (const { type, value } of fmt.formatToParts(new Date(ms))) o[type] = Number(value);
  return { y: o.year, m: o.month, d: o.day, h: o.hour, min: o.minute, s: o.second };
}
function tzOffsetMs(ms, tz) {
  const p = partsIn(ms, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(ms / 1000) * 1000;
}
function zonedToUtcMs(y, m, d, h, min, tz) {
  const guess = Date.UTC(y, m - 1, d, h, min);
  const firstPass = guess - tzOffsetMs(guess, tz);
  return guess - tzOffsetMs(firstPass, tz); // second pass handles DST boundaries
}
function labelFor(ms, tz) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'long', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(ms));
}

// ── Slot generation ────────────────────────────────────────────────────────────
function openSlots(busy, days) {
  const c = config();
  const now = Date.now();
  const earliest = now + c.minNoticeHours * 3600e3;
  const today = partsIn(now, c.tz);
  const slots = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(Date.UTC(today.y, today.m - 1, today.d + i)); // calendar-date arithmetic
    if (!WEEKDAYS.includes(day.getUTCDay())) continue;
    const y = day.getUTCFullYear(), m = day.getUTCMonth() + 1, d = day.getUTCDate();
    for (let mins = c.startHour * 60; mins + c.slotMinutes <= c.endHour * 60; mins += c.slotMinutes) {
      const start = zonedToUtcMs(y, m, d, Math.floor(mins / 60), mins % 60, c.tz);
      const end = start + c.slotMinutes * 60e3;
      if (start < earliest) continue;
      if (busy.some(([bs, be]) => start < be && end > bs)) continue;
      slots.push({ start: new Date(start).toISOString(), label: labelFor(start, c.tz) });
    }
  }
  return slots;
}

// ── Google Calendar (service account, JWT — no SDK) ────────────────────────────
function serviceAccount() {
  try {
    return JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64 || '', 'base64').toString('utf8'));
  } catch {
    return null;
  }
}
function googleConfigured() {
  const sa = serviceAccount();
  return Boolean(sa?.client_email && sa?.private_key && process.env.GOOGLE_CALENDAR_ID);
}

let tokenCache = { token: null, expiresAt: 0 };
async function googleToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60e3) return tokenCache.token;
  const sa = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google auth failed: ${data.error || res.status}`);
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}
async function googleFetch(path, options = {}) {
  const token = await googleToken();
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${data.error?.message || 'request failed'}`);
  return data;
}
async function busyIntervals(days) {
  const calId = process.env.GOOGLE_CALENDAR_ID;
  const now = Date.now();
  const data = await googleFetch('/freeBusy', {
    method: 'POST',
    body: JSON.stringify({
      timeMin: new Date(now).toISOString(),
      timeMax: new Date(now + (days + 1) * 864e5).toISOString(),
      items: [{ id: calId }],
    }),
  });
  const cal = data.calendars?.[calId];
  if (cal?.errors?.length) throw new Error('Calendar is not shared with the service account');
  return (cal?.busy || []).map(b => [Date.parse(b.start), Date.parse(b.end)]);
}

async function getSlots(days) {
  const d = Math.min(Math.max(Number(days) || config().daysAhead, 1), 30);
  if (!googleConfigured()) return { mode: 'requested', slots: openSlots([], d) };
  return { mode: 'live', slots: openSlots(await busyIntervals(d), d) };
}

// Real event titles/times for the CRM "Calendar" widget — distinct from busyIntervals(),
// which only returns free/busy ranges with no event data. Admin-gated (see handler).
async function listUpcoming(days) {
  const d = Math.min(Math.max(Number(days) || 14, 1), 30);
  if (!googleConfigured()) return { mode: 'requested', events: [] };
  const calId = process.env.GOOGLE_CALENDAR_ID;
  const now = Date.now();
  const data = await googleFetch(
    `/calendars/${encodeURIComponent(calId)}/events?` + new URLSearchParams({
      timeMin: new Date(now).toISOString(),
      timeMax: new Date(now + (d + 1) * 864e5).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '8',
    })
  );
  const c = config();
  const events = (data.items || [])
    .filter(e => e.start?.dateTime) // skip all-day events, not bookable sessions
    .map(e => ({
      id: e.id,
      summary: e.summary || 'Untitled session',
      start: e.start.dateTime,
      end: e.end?.dateTime || null,
      label: labelFor(Date.parse(e.start.dateTime), c.tz),
      link: e.htmlLink || null,
    }));
  return { mode: 'live', events };
}

// ── Booking ────────────────────────────────────────────────────────────────────
function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function validEmail(e) {
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function buildIcs({ start, end, summary, description }) {
  const fmt = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MGC Global Consulting//Booking//EN', 'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@mgcglobalconsulting.com`,
    `DTSTAMP:${fmt(Date.now())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(summary)}`, `DESCRIPTION:${esc(description)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

// Portal bookings send the client's Supabase session; verify it server-side to get their user id.
async function clientIdFromToken(token) {
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const user = await res.json();
    return typeof user.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
}

// Same Supabase session, checked against ADMIN_EMAILS instead of returning a client id.
async function isAdminToken(token) {
  if (!token) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` } });
    if (!res.ok) return false;
    const user = await res.json();
    return typeof user.email === 'string' && ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch {
    return false;
  }
}

async function bookSession(input, clientId = null) {
  const name = clean(input.name, 120);
  const email = clean(input.email, 254);
  const service = SERVICES.includes(input.service) ? input.service : null;
  const notes = clean(input.notes, 1000);
  if (!name) throw badRequest('Name is required');
  if (!validEmail(email)) throw badRequest('A valid email is required');
  if (!service) throw badRequest('Choose a service');

  const startMs = Date.parse(input.start);
  if (!Number.isFinite(startMs)) throw badRequest('Invalid start time');

  // Re-check the exact slot server-side. Never trust a time the client or model supplies.
  const { mode, slots } = await getSlots();
  const slot = slots.find(s => Date.parse(s.start) === startMs);
  if (!slot) throw badRequest('That time is no longer open. Please choose another.');

  const c = config();
  const endMs = startMs + c.slotMinutes * 60e3;
  const summary = `${service} — ${name}`;
  const serviceLine = clean(input.service_line, 120);
  let eventLink = null;
  let eventId = null;

  if (mode === 'live') {
    const event = await googleFetch(
      `/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID)}/events`,
      {
        method: 'POST',
        body: JSON.stringify({
          summary,
          // No attendees: a service account on a shared calendar can't invite guests (Google returns
          // 403 without Domain-Wide Delegation). The client gets the .ics file and confirmation email.
          description: `Booked via mgcglobalconsulting.com\nClient: ${name} <${email}>${serviceLine ? `\nService line: ${serviceLine}` : ''}\nNotes: ${notes || 'none'}\nFee: $${SESSION_PRICE_USD}`,
          start: { dateTime: slot.start, timeZone: c.tz },
          end: { dateTime: new Date(endMs).toISOString(), timeZone: c.tz },
        }),
      }
    );
    eventLink = event.htmlLink || null;
    eventId = event.id || null;
  }

  // Supabase booking row, so the portal and admin see the same appointment as Google Calendar.
  if (hasServiceRole()) {
    await db('mgc_bookings', {
      method: 'POST',
      prefer: 'return=minimal',
      body: {
        client_id: clientId,
        name, email, service,
        service_line: serviceLine || null,
        message: notes || null,
        requested_date: slot.start.slice(0, 10),
        scheduled_start: slot.start,
        calendar_event_id: eventId,
        status: mode === 'live' ? 'confirmed' : 'pending',
      },
    }).catch(err => console.error('Booking row failed:', err.message));
  }

  // CRM record in Notion through the existing lead-intake function. Failure here must not block the booking.
  try {
    await fetch(`${SITE_URL}/.netlify/functions/lead-intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email, service, message: notes, requested_date: slot.label,
        source: mode === 'live' ? 'AI Booking Assistant (confirmed)' : 'AI Booking Assistant (request)',
      }),
    });
  } catch (err) {
    console.error('CRM sync failed:', err.message);
  }

  // Supabase lead row, confirmation email and Slack card. Never blocks the booking.
  await recordLead({
    name, email, message: notes,
    source: mode === 'live' ? 'Booking (confirmed)' : 'Booking (request)',
    booking: { service, label: slot.label, start: slot.start, status: mode === 'live' ? 'confirmed' : 'requested' },
  }).catch(err => console.error('Lead record failed:', err.message));

  return {
    status: mode === 'live' ? 'confirmed' : 'requested',
    label: slot.label,
    start: slot.start,
    end: new Date(endMs).toISOString(),
    service,
    price_usd: SESSION_PRICE_USD,
    eventLink,
    ics: buildIcs({ start: startMs, end: endMs, summary, description: `Session fee: $${SESSION_PRICE_USD}` }),
  };
}

// ── AI assistant (Claude tool use) ─────────────────────────────────────────────
const TOOLS = [
  {
    name: 'get_availability',
    description: 'List open 60-minute session times for the coming days. Call this before offering any time.',
    input_schema: { type: 'object', properties: { days: { type: 'integer', minimum: 1, maximum: 30 } } },
  },
  {
    name: 'book_session',
    description: 'Book one session. Use a start value copied exactly from get_availability, and only after the visitor gave their name and email and agreed to that time.',
    input_schema: {
      type: 'object',
      properties: {
        start: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        service: { type: 'string', enum: SERVICES },
        notes: { type: 'string' },
      },
      required: ['start', 'name', 'email', 'service'],
    },
  },
];

function systemPrompt() {
  const c = config();
  return `You are the booking assistant for MGC Global Consulting (AI strategy, automation, CRM optimization, systems design).
Help visitors understand the services, answer scheduling and calendar questions, and book a session.

Facts:
- Session: ${c.slotMinutes} minutes, $${SESSION_PRICE_USD}. Monday to Friday, ${c.startHour}:00 to ${c.endHour}:00 (${c.tz}). Minimum ${c.minNoticeHours} hours' notice.
- Bookings go on MGC's Google Calendar. If the calendar is not connected, the request is saved and the team confirms within 24 hours.
- Calendar sync: Google Calendar is the source of truth.
  - Apple Calendar (iPhone/Mac): Settings > Calendar > Accounts > add the Google account, so bookings appear there.
  - Notion Calendar: sign in with the same Google account.
  - Any booking can also be downloaded as an .ics file and imported into Apple, Google, or Notion Calendar.

Rules:
- Call get_availability before offering any time. Never invent a time.
- Before calling book_session, get the visitor's name and email and confirm the chosen time.
- Only say a session is booked after book_session succeeds.
- Do not give legal, tax, or credit advice. Offer a session instead.
- Keep replies to 2-4 short sentences in plain English. No emojis.`;
}

const TOOL_LIMIT_STEPS = 4;

async function runTool(name, input) {
  if (name === 'get_availability') {
    const { mode, slots } = await getSlots(input.days);
    return { mode, slots: slots.slice(0, 60).map(s => ({ start: s.start, label: s.label })) };
  }
  if (name === 'book_session') return bookSession(input);
  throw new Error(`Unknown tool: ${name}`);
}

async function callClaude(messages) {
  if (!process.env.ANTHROPIC_API_KEY) throw Object.assign(new Error('Assistant not configured'), { status: 500 });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, system: systemPrompt(), tools: TOOLS, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  return res.json();
}

async function chat(rawMessages) {
  const valid = rawMessages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
  const first = valid.findIndex(m => m.role === 'user');
  const convo = first >= 0 ? valid.slice(first) : [];
  if (!convo.length) throw badRequest('Send a message to start');

  let booking = null;
  let reply = '';
  for (let step = 0; step < TOOL_LIMIT_STEPS; step++) {
    const res = await callClaude(convo);
    const toolUses = res.content.filter(b => b.type === 'tool_use');
    if (!toolUses.length) {
      reply = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      break;
    }
    convo.push({ role: 'assistant', content: res.content });
    const results = [];
    for (const use of toolUses) {
      try {
        const out = await runTool(use.name, use.input || {});
        if (use.name === 'book_session') booking = out;
        const { ics, ...forModel } = out; // the model does not need the .ics body
        results.push({ type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(forModel) });
      } catch (err) {
        results.push({ type: 'tool_result', tool_use_id: use.id, content: JSON.stringify({ error: err.message }), is_error: true });
      }
    }
    convo.push({ role: 'user', content: results });
  }

  return {
    reply: reply || 'Sorry, I could not finish that. Please use the time picker or email info@mgcglobalconsulting.com.',
    booking,
  };
}

// ── Entry point ────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || ALLOWED_ORIGINS[0];
  if (!ALLOWED_ORIGINS.includes(requestOrigin)) {
    return respond(403, ALLOWED_ORIGINS[0], { error: 'Origin not allowed' });
  }
  const origin = requestOrigin;

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(origin), body: '' };
  if (event.httpMethod !== 'POST') return respond(405, origin, { error: 'Method not allowed' });

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
  if (rateLimited(ip)) return respond(429, origin, { error: 'Too many requests. Please try again in a few minutes.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return respond(400, origin, { error: 'Invalid JSON' });
  }

  try {
    if (body.action === 'slots') {
      const { mode, slots } = await getSlots(body.days);
      return respond(200, origin, { mode, slots: slots.slice(0, 120), price_usd: SESSION_PRICE_USD });
    }
    if (body.action === 'book') {
      const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
      return respond(200, origin, await bookSession(body, await clientIdFromToken(token)));
    }
    if (body.action === 'chat') {
      return respond(200, origin, await chat(Array.isArray(body.messages) ? body.messages : []));
    }
    if (body.action === 'upcoming') {
      const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
      if (!(await isAdminToken(token))) return respond(403, origin, { error: 'Admin access required' });
      return respond(200, origin, await listUpcoming(body.days));
    }
    return respond(400, origin, { error: 'Unknown action' });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error('Booking assistant error:', err.message);
    return respond(status, origin, {
      error: status === 500 ? 'Something went wrong. Please email info@mgcglobalconsulting.com.' : err.message,
    });
  }
};

// Exposed for grok-voice-tools.js, so the voice-call tool bridge can reuse the same Google
// Calendar + Supabase booking logic instead of reimplementing it. Additive only — exports.handler
// above is unchanged and remains the HTTP entry point for the existing booking widget/chat.
module.exports.getSlots = getSlots;
module.exports.bookSession = bookSession;
module.exports.SESSION_PRICE_USD = SESSION_PRICE_USD;
module.exports.SERVICES = SERVICES;
