'use strict';
/**
 * MGC Global Consulting - New Client Signup Handler
 * --------------------------------------------------
 * POST /.netlify/functions/new-client-signup
 *
 * Triggered by: Supabase Database Webhook on mgc_client_profiles INSERT
 * Writes to:    Notion CRM (Contact + Company + Lead Deal)
 *
 * Setup in Supabase Dashboard:
 *   Database > Webhooks > Create webhook
 *   Table: mgc_client_profiles | Event: INSERT
 *   URL: https://mgcglobalconsulting.com/.netlify/functions/new-client-signup
 *   HTTP Headers: Authorization: Bearer {SUPABASE_WEBHOOK_SECRET}
 */

/* -- Notion helper ---------------------------------------------------- */
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

/* -- Find or create Company ------------------------------------------- */
async function findOrCreateCompany(companyName) {
  if (!companyName) return null;

  const search = await notion(
    `databases/${process.env.NOTION_COMPANIES_DATABASE_ID}/query`,
    'POST',
    { filter: { property: 'Company Name', title: { equals: companyName } } }
  );
  if (search.results?.length) return search.results[0].id;

  const created = await notion('pages', 'POST', {
    parent: { database_id: process.env.NOTION_COMPANIES_DATABASE_ID },
    properties: {
      'Company Name': { title: [{ text: { content: companyName } }] },
      'Account Status': { select: { name: 'Lead' } },
    },
  });
  console.log('[Notion] Company created:', created.id);
  return created.id;
}

/* -- Find or create Contact ------------------------------------------- */
async function findOrCreateContact(profile, companyId) {
  const email = profile.email || '';
  const name = profile.full_name || email.split('@')[0] || 'New Client';
  const today = new Date().toISOString().split('T')[0];

  if (email) {
    const search = await notion(
      `databases/${process.env.NOTION_CONTACTS_DATABASE_ID}/query`,
      'POST',
      { filter: { property: 'Email', email: { equals: email } } }
    );
    if (search.results?.length) {
      console.log('[Notion] Contact already exists:', search.results[0].id);
      return search.results[0].id;
    }
  }

  const created = await notion('pages', 'POST', {
    parent: { database_id: process.env.NOTION_CONTACTS_DATABASE_ID },
    properties: {
      'Full Name':         { title: [{ text: { content: name } }] },
      'Email':             { email: email || null },
      'Company':           { relation: companyId ? [{ id: companyId }] : [] },
      'Status':            { select: { name: 'Lead' } },
      'Source':            { select: { name: 'Portal Signup' } },
      'First Contact Date':{ date: { start: today } },
      'Last Contact Date': { date: { start: today } },
    },
  });
  console.log('[Notion] Contact created:', created.id, email);
  return created.id;
}

/* -- Create Lead Deal ------------------------------------------------- */
async function createLeadDeal(profile, companyId, contactId) {
  const today = new Date().toISOString().split('T')[0];
  const name = profile.full_name || profile.email?.split('@')[0] || 'New Client';

  const created = await notion('pages', 'POST', {
    parent: { database_id: process.env.NOTION_DEALS_DATABASE_ID },
    properties: {
      'Deal Name': { title: [{ text: { content: `${name} - Portal Signup` } }] },
      'Stage':     { select: { name: 'Lead' } },
      'Source':    { select: { name: 'Portal Signup' } },
      'Company':   { relation: companyId ? [{ id: companyId }] : [] },
      'Contact':   { relation: contactId ? [{ id: contactId }] : [] },
      'Close Date':{ date: { start: today } },
    },
  });
  console.log('[Notion] Lead deal created:', created.id);
  return created.id;
}

/* -- Main handler ----------------------------------------------------- */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Verify webhook secret
  const authHeader = event.headers['authorization'] || '';
  const expectedToken = process.env.SUPABASE_WEBHOOK_SECRET;
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    console.error('[Signup] Unauthorized webhook call');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Supabase sends: { type, table, schema, record, old_record }
  if (payload.type !== 'INSERT' || payload.table !== 'mgc_client_profiles') {
    return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
  }

  const profile = payload.record;
  console.log('[Signup] New client profile:', profile.id, profile.email);

  try {
    const companyId = await findOrCreateCompany(profile.company);
    const contactId = await findOrCreateContact(profile, companyId);
    await createLeadDeal(profile, companyId, contactId);
    console.log('[Signup] Notion sync complete for', profile.email);
  } catch (err) {
    console.error('[Signup] Notion sync failed:', err.message);
    // Return 200 so Supabase does not retry on Notion errors
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
