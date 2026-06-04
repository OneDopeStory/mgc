'use strict';
/**
 * MGC Global Consulting — Stripe Payment Webhook
 * ─────────────────────────────────────────────────
 * POST /.netlify/functions/payment-webhook
 *
 * Triggered by Stripe on: checkout.session.completed
 * Writes to: Notion CRM (Invoices + Contacts + Companies)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* ── Notion helper ──────────────────────────────────────────────────── */
function notion(path, method = 'GET', data) {
  return fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  }).then(r => r.json());
}

/* ── Find or create a Company record ───────────────────────────────── */
async function findOrCreateCompany(name) {
  const search = await notion(
    `databases/${process.env.NOTION_COMPANIES_DATABASE_ID}/query`,
    'POST',
    { filter: { property: 'Company Name', title: { equals: name } } }
  );
  if (search.results?.length) return search.results[0].id;

  const created = await notion('pages', 'POST', {
    parent: { database_id: process.env.NOTION_COMPANIES_DATABASE_ID },
    properties: {
      'Company Name': { title: [{ text: { content: name } }] },
      'Account Status': { select: { name: 'Active Client' } },
    },
  });
  console.log('[Notion] Company created:', created.id);
  return created.id;
}

/* ── Close open Lead deal, or create a Closed Won deal directly ─────── */
async function closeOrCreateDeal(session, companyId, contactId) {
  const today = new Date().toISOString().split('T')[0];
  const service = session.metadata?.source || 'Website Purchase';
  const amount = session.amount_total / 100;

  // Look for an open Lead deal tied to this company
  const search = companyId
    ? await notion(
        `databases/${process.env.NOTION_DEALS_DATABASE_ID}/query`,
        'POST',
        {
          filter: {
            and: [
              { property: 'Company', relation: { contains: companyId } },
              { property: 'Stage', select: { equals: 'Lead' } },
            ],
          },
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
          page_size: 1,
        }
      )
    : { results: [] };

  if (search.results?.length) {
    await notion(`pages/${search.results[0].id}`, 'PATCH', {
      properties: {
        'Stage': { select: { name: 'Closed Won' } },
        'Close Date': { date: { start: today } },
        'Deal Value': { number: amount },
      },
    });
    console.log('[Notion] Deal closed (Won):', search.results[0].id, `$${amount}`);
  } else {
    const created = await notion('pages', 'POST', {
      parent: { database_id: process.env.NOTION_DEALS_DATABASE_ID },
      properties: {
        'Deal Name': { title: [{ text: { content: `${service} — Payment` } }] },
        'Stage': { select: { name: 'Closed Won' } },
        'Source': { select: { name: 'Stripe Payment' } },
        'Company': { relation: companyId ? [{ id: companyId }] : [] },
        'Contact': { relation: contactId ? [{ id: contactId }] : [] },
        'Deal Value': { number: amount },
        'Close Date': { date: { start: today } },
      },
    });
    console.log('[Notion] Deal created (Closed Won):', created.id, `$${amount}`);
  }
}

/* ── Find or create a Contact record ───────────────────────────────── */
async function findOrCreateContact(session, companyId) {
  const email = session.customer_email || '';
  const name = session.customer_details?.name || email;

  const search = await notion(
    `databases/${process.env.NOTION_CONTACTS_DATABASE_ID}/query`,
    'POST',
    { filter: { property: 'Email', email: { equals: email } } }
  );

  if (search.results?.length) {
    // Update status to Active
    await notion(`pages/${search.results[0].id}`, 'PATCH', {
      properties: {
        Status: { select: { name: 'Active' } },
        'Last Contact Date': { date: { start: new Date().toISOString().split('T')[0] } },
      },
    });
    console.log('[Notion] Contact updated:', search.results[0].id);
    return search.results[0].id;
  }

  const created = await notion('pages', 'POST', {
    parent: { database_id: process.env.NOTION_CONTACTS_DATABASE_ID },
    properties: {
      'Full Name': { title: [{ text: { content: name } }] },
      'Email': { email },
      'Phone': { phone_number: session.customer_details?.phone || null },
      'Company': { relation: companyId ? [{ id: companyId }] : [] },
      'Status': { select: { name: 'Active' } },
      'Source': { select: { name: 'Website' } },
      'First Contact Date': { date: { start: new Date().toISOString().split('T')[0] } },
      'Last Contact Date': { date: { start: new Date().toISOString().split('T')[0] } },
    },
  });
  console.log('[Notion] Contact created:', created.id);
  return created.id;
}

/* ── Create Invoice record ──────────────────────────────────────────── */
async function createInvoice(session, companyId) {
  const invoiceNumber = `MGC-${Date.now()}`;
  const amount = session.amount_total / 100;
  const today = new Date().toISOString().split('T')[0];

  const created = await notion('pages', 'POST', {
    parent: { database_id: process.env.NOTION_INVOICES_DATABASE_ID },
    properties: {
      'Invoice Number': { title: [{ text: { content: invoiceNumber } }] },
      'Company': { relation: companyId ? [{ id: companyId }] : [] },
      'Amount': { number: amount },
      'Status': { select: { name: 'Paid' } },
      'Issue Date': { date: { start: today } },
      'Paid Date': { date: { start: today } },
      'Payment Method': { select: { name: 'Stripe' } },
      'Stripe Payment Intent ID': { rich_text: [{ text: { content: session.payment_intent || '' } }] },
      'Service Description': { rich_text: [{ text: { content: session.metadata?.source || 'Website purchase' } }] },
    },
  });
  console.log('[Notion] Invoice created:', created.id, invoiceNumber, `$${amount}`);
  return created.id;
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

  try {
    const customerName = session.customer_details?.name || session.customer_email || 'Unknown';
    const companyId = await findOrCreateCompany(customerName);
    const contactId = await findOrCreateContact(session, companyId);
    await Promise.allSettled([
      createInvoice(session, companyId),
      closeOrCreateDeal(session, companyId, contactId),
    ]);
    console.log('[Webhook] Notion sync complete for', session.id);
  } catch (err) {
    console.error('[Webhook] Notion sync failed:', err.message);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
