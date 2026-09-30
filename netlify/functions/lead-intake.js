'use strict';
/**
 * MGC Global Consulting — Lead Intake
 * POST /.netlify/functions/lead-intake
 *
 * Triggered by: website booking form submission
 * Writes to: Notion CRM — Company → Contact → Deal ("Lead" stage)
 * Rules:
 *   - One Deal per submission (every form submit = new Deal)
 *   - Existing contact: update Status + Last Contact Date, then create new Deal
 */

const ALLOWED_ORIGIN = 'https://www.mgcglobalconsulting.com';

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

async function findOrCreateCompany(name) {
  if (!name) return null;
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
      'Account Status': { select: { name: 'Lead' } },
    },
  });
  console.log('[Lead Intake] Company created:', created.id);
  return created.id;
}

async function findOrUpdateContact(name, email, companyId) {
  const today = new Date().toISOString().split('T')[0];
  const search = await notion(
    `databases/${process.env.NOTION_CONTACTS_DATABASE_ID}/query`,
    'POST',
    { filter: { property: 'Email', email: { equals: email } } }
  );

  if (search.results?.length) {
    const existing = search.results[0];
    await notion(`pages/${existing.id}`, 'PATCH', {
      properties: {
        'Status': { select: { name: 'Lead' } },
        'Last Contact Date': { date: { start: today } },
      },
    });
    console.log('[Lead Intake] Contact updated:', existing.id);
    return existing.id;
  }

  const created = await notion('pages', 'POST', {
    parent: { database_id: process.env.NOTION_CONTACTS_DATABASE_ID },
    properties: {
      'Full Name': { title: [{ text: { content: name } }] },
      'Email': { email },
      'Company': { relation: companyId ? [{ id: companyId }] : [] },
      'Status': { select: { name: 'Lead' } },
      'Source': { select: { name: 'Website Form' } },
      'First Contact Date': { date: { start: today } },
      'Last Contact Date': { date: { start: today } },
    },
  });
  console.log('[Lead Intake] Contact created:', created.id);
  return created.id;
}

async function createDeal(name, service, message, requestedDate, companyId, contactId, extras) {
  const today = new Date().toISOString().split('T')[0];

  const noteLines = [
    requestedDate && `Requested date: ${requestedDate}`,
    message && `Challenge: ${message}`,
    extras.visitorType && `Visitor type: ${extras.visitorType}`,
    extras.assignedSubAgent && `Assigned sub-agent: ${extras.assignedSubAgent}`,
    extras.recommendedNextStep && `Recommended next step: ${extras.recommendedNextStep}`,
    extras.readinessScore !== undefined && `Readiness score: ${extras.readinessScore}/100 — ${extras.readinessCategory || ''}`,
    extras.timeline && `Timeline: ${extras.timeline}`,
    extras.budgetRange && `Budget range: ${extras.budgetRange}`,
    extras.source && `Source: ${extras.source}`,
  ].filter(Boolean).join('\n');

  const created = await notion('pages', 'POST', {
    parent: { database_id: process.env.NOTION_DEALS_DATABASE_ID },
    properties: {
      'Deal Name': { title: [{ text: { content: `${service} — ${name}` } }] },
      'Stage': { select: { name: 'Lead' } },
      'Service Type': { select: { name: service } },
      'Source': { select: { name: extras.source || 'Website Form' } },
      'Company': { relation: companyId ? [{ id: companyId }] : [] },
      'Contact': { relation: contactId ? [{ id: contactId }] : [] },
      'Created Date': { date: { start: today } },
      ...(noteLines && { 'Notes': { rich_text: [{ text: { content: noteLines } }] } }),
    },
  });
  console.log('[Lead Intake] Deal created:', created.id);
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: 'Invalid JSON' };
  }

  const {
    name, email, company, service, message, requested_date,
    visitor_type, assigned_sub_agent, readiness_score, readiness_category,
    recommended_next_step, challenge, timeline, budget_range, source,
  } = body;

  if (!name || !email || !service) {
    return { statusCode: 400, headers: corsHeaders, body: 'Missing required fields' };
  }

  console.log('[Lead Intake] Processing submission from', email);

  const extras = {
    visitorType: visitor_type || '',
    assignedSubAgent: assigned_sub_agent || '',
    readinessScore: readiness_score,
    readinessCategory: readiness_category || '',
    recommendedNextStep: recommended_next_step || '',
    timeline: timeline || '',
    budgetRange: budget_range || '',
    source: source || 'Website Form',
  };

  try {
    const companyId = await findOrCreateCompany(company || null);
    const contactId = await findOrUpdateContact(name, email, companyId);
    await createDeal(name, service, challenge || message, requested_date, companyId, contactId, extras);
    console.log('[Lead Intake] Notion sync complete for', email);
  } catch (err) {
    console.error('[Lead Intake] Notion sync failed:', err.message);
    // Non-blocking — form UX succeeds even if CRM write fails
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true }),
  };
};
