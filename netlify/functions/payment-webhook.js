'use strict';
/**
 * MGC Global Consulting — Stripe Payment Webhook
 * ─────────────────────────────────────────────────
 * POST /.netlify/functions/payment-webhook
 *
 * Triggered by Stripe on: checkout.session.completed
 * Fans out to: QuickBooks → Google Sheets → Slack → WhatsApp → Notion
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* ── Helpers ────────────────────────────────────────────────────────── */

async function postJSON(url, data, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  return res;
}

/* ── QuickBooks ─────────────────────────────────────────────────────── */
async function syncQuickBooks(session) {
  // QB OAuth2 token refresh
  const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.QB_REFRESH_TOKEN,
    }),
  });
  const { access_token } = await tokenRes.json();
  const BASE = `https://quickbooks.api.intuit.com/v3/company/${process.env.QB_REALM_ID}`;
  const AUTH = { Authorization: `Bearer ${access_token}`, Accept: 'application/json' };

  // Find or create customer
  const safeEmail = (session.customer_email || '').replace(/'/g, "\\'");
  const qsRes = await fetch(
    `${BASE}/query?query=SELECT * FROM Customer WHERE PrimaryEmailAddr='${safeEmail}'&minorversion=65`,
    { headers: AUTH }
  );
  const qsData = await qsRes.json();
  let customerId = qsData.QueryResponse?.Customer?.[0]?.Id;

  if (!customerId) {
    const custRes = await postJSON(
      `${BASE}/customer?minorversion=65`,
      {
        DisplayName: session.customer_details?.name || session.customer_email,
        PrimaryEmailAddr: { Address: session.customer_email },
        PrimaryPhone: { FreeFormNumber: session.customer_details?.phone || '' },
      },
      { ...AUTH, 'Content-Type': 'application/json' }
    );
    const custData = await custRes.json();
    customerId = custData.Customer?.Id;
  }

  // Create invoice + payment
  const amount = session.amount_total / 100;
  const invoiceRes = await postJSON(
    `${BASE}/invoice?minorversion=65`,
    {
      CustomerRef: { value: customerId },
      Line: [{
        Amount: amount,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: { value: '1', name: 'Services' },
          Qty: 1,
          UnitPrice: amount,
        },
      }],
      DocNumber: `MGC-${Date.now()}`,
    },
    { ...AUTH, 'Content-Type': 'application/json' }
  );
  const invoiceData = await invoiceRes.json();

  console.log('[QB] Invoice created:', invoiceData.Invoice?.Id);
  return invoiceData.Invoice?.Id;
}

/* ── Google Sheets ──────────────────────────────────────────────────── */
async function appendSheets(session) {
  const SPREADSHEET_ID = '19yop6QhNbsCQ8Jsj3X1hbO-Mjqo9OmSPp4eatm65HWo';

  // Google JWT auth via service account
  const keyJson = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf-8')
  );

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: keyJson.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const { createSign } = await import('node:crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(keyJson.private_key, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const { access_token } = await tokenRes.json();

  const row = [
    new Date().toISOString(),
    session.id,
    session.customer_details?.name || '',
    session.customer_email || '',
    session.customer_details?.phone || '',
    (session.amount_total / 100).toFixed(2),
    session.currency?.toUpperCase() || 'USD',
    session.payment_status,
    session.metadata?.source || 'website',
    session.payment_intent || '',
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Payments!A:J:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );

  console.log('[Sheets] Row appended');
}

/* ── Slack ──────────────────────────────────────────────────────────── */
async function notifySlack(session) {
  const amount = `$${(session.amount_total / 100).toFixed(2)}`;
  await postJSON(process.env.SLACK_PAYMENTS_WEBHOOK, {
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `💰 Payment Received — ${amount}` } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Customer:*\n${session.customer_details?.name || '—'}` },
          { type: 'mrkdwn', text: `*Email:*\n${session.customer_email || '—'}` },
          { type: 'mrkdwn', text: `*Amount:*\n${amount} ${session.currency?.toUpperCase()}` },
          { type: 'mrkdwn', text: `*Status:*\n${session.payment_status}` },
          { type: 'mrkdwn', text: `*Session:*\n${session.id}` },
          { type: 'mrkdwn', text: `*Source:*\n${session.metadata?.source || 'website'}` },
        ],
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `⏰ ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET` }],
      },
    ],
  });
  console.log('[Slack] Notification sent');
}

/* ── WhatsApp (Twilio) ──────────────────────────────────────────────── */
async function sendWhatsApp(session) {
  const phone = session.customer_details?.phone;
  if (!phone) { console.log('[WhatsApp] No phone — skipping'); return; }

  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
  const amount = `$${(session.amount_total / 100).toFixed(2)}`;

  const body = new URLSearchParams({
    From: process.env.TWILIO_WHATSAPP_FROM,
    To: `whatsapp:${e164}`,
    Body:
      `✅ *Payment Confirmed — MGC Global Consulting*\n\n` +
      `Hi ${session.customer_details?.name || 'there'},\n\n` +
      `We've received your payment of *${amount}*. Thank you!\n\n` +
      `Our team will reach out within 24 hours to begin onboarding.\n\n` +
      `Questions? Reply here or email mark@mgcglobalconsulting.com\n\n— The MGC Team`,
  });

  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  );
  console.log('[WhatsApp] Receipt sent to', e164);
}

/* ── Notion ─────────────────────────────────────────────────────────── */
async function updateNotion(session) {
  const email = session.customer_email;
  const notion = (path, method = 'GET', data) =>
    fetch(`https://api.notion.com/v1/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    }).then(r => r.json());

  // Find client page by email
  const search = await notion(
    `databases/${process.env.NOTION_CLIENTS_DATABASE_ID}/query`,
    'POST',
    { filter: { property: 'Email', email: { equals: email } } }
  );

  const page = search.results?.[0];
  if (!page) { console.log('[Notion] No client record found for', email); return; }

  const amount = `$${(session.amount_total / 100).toFixed(2)}`;

  // Update status to Active + log payment
  await notion(`pages/${page.id}`, 'PATCH', {
    properties: {
      Status: { select: { name: 'Active' } },
      'Last Payment': { number: session.amount_total / 100 },
      'Last Payment Date': { date: { start: new Date().toISOString().split('T')[0] } },
    },
  });

  // Append payment block
  await notion(`blocks/${page.id}/children`, 'PATCH', {
    children: [{
      type: 'callout',
      callout: {
        rich_text: [{ type: 'text', text: { content: `💰 Payment ${amount} received — ${new Date().toLocaleDateString()}` }, annotations: { bold: true } }],
        icon: { emoji: '✅' },
        color: 'green_background',
      },
    }],
  });

  console.log('[Notion] Client updated to Active');
}

/* ── Main handler ───────────────────────────────────────────────────── */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
  }

  const session = stripeEvent.data.object;
  console.log('[Webhook] Processing payment:', session.id);

  const results = await Promise.allSettled([
    syncQuickBooks(session),
    appendSheets(session),
    notifySlack(session),
    sendWhatsApp(session),
    updateNotion(session),
  ]);

  const labels = ['QuickBooks', 'Sheets', 'Slack', 'WhatsApp', 'Notion'];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[Webhook] ${labels[i]} failed:`, r.reason?.message);
    } else {
      console.log(`[Webhook] ${labels[i]} ✓`);
    }
  });

  const failed = results.filter(r => r.status === 'rejected').length;
  console.log(`[Webhook] ${session.id} — ${results.length - failed}/${results.length} integrations succeeded`);

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
