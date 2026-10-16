'use strict';
/**
 * MGC Global Consulting — Stripe Checkout Session Creator
 * ────────────────────────────────────────────────────────
 * POST /.netlify/functions/create-checkout
 * Body: { priceId, mode, customerEmail?, metadata? }
 */

// Initialize inside the handler so missing configuration returns a useful response.
const Stripe = require('stripe');

// Membership tier → price ID mapping (resolved server-side so client never sees IDs)
const TIER_PRICES = {
  starter: process.env.STRIPE_PRICE_MEMBERSHIP_STARTER,
  pro:     process.env.STRIPE_PRICE_MEMBERSHIP_PRO,
  elite:   process.env.STRIPE_PRICE_MEMBERSHIP_ELITE,
};

// Service slug → price ID mapping (resolved server-side)
const SERVICE_PRICES = {
  'ai-assessment':      process.env.STRIPE_PRICE_AI_CONSULTING_ASSESSMENT,
  'ai-roadmap':         process.env.STRIPE_PRICE_AI_CONSULTING_ROADMAP,
  'automation-starter': process.env.STRIPE_PRICE_AUTOMATION_STARTER,
  'automation-full':    process.env.STRIPE_PRICE_AUTOMATION_FULL,
  'crm-audit':          process.env.STRIPE_PRICE_CRM_AUDIT,
  'crm-build':          process.env.STRIPE_PRICE_CRM_BUILD,
  'workshop-half':      process.env.STRIPE_PRICE_WORKSHOP_HALF,
  'workshop-full':      process.env.STRIPE_PRICE_WORKSHOP_FULL,
  'monthly-retainer':   process.env.STRIPE_PRICE_MONTHLY_RETAINER || process.env.STRIPE_PRICE_RETAINER,
  'systems-design':     process.env.STRIPE_PRICE_SYSTEMS_DESIGN,
};

const ALLOWED_PRICES = new Set([
  // Membership tiers
  process.env.STRIPE_PRICE_MEMBERSHIP_STARTER,
  process.env.STRIPE_PRICE_MEMBERSHIP_PRO,
  process.env.STRIPE_PRICE_MEMBERSHIP_ELITE,
  // Services (one-time & retainer)
  process.env.STRIPE_PRICE_AI_CONSULTING_ASSESSMENT,
  process.env.STRIPE_PRICE_AI_CONSULTING_ROADMAP,
  process.env.STRIPE_PRICE_AUTOMATION_STARTER,
  process.env.STRIPE_PRICE_AUTOMATION_FULL,
  process.env.STRIPE_PRICE_CRM_AUDIT,
  process.env.STRIPE_PRICE_CRM_BUILD,
  process.env.STRIPE_PRICE_WORKSHOP_HALF,
  process.env.STRIPE_PRICE_WORKSHOP_FULL,
  process.env.STRIPE_PRICE_MONTHLY_RETAINER,
  process.env.STRIPE_PRICE_RETAINER,
  process.env.STRIPE_PRICE_SYSTEMS_DESIGN,
].filter(Boolean));

const CORS = {
  'Access-Control-Allow-Origin': 'https://www.mgcglobalconsulting.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid request' }) };
  }
  let { priceId, mode = 'payment', tier, service, customerEmail, metadata = {} } = body;
  if ([priceId, tier, service, customerEmail].some(value => value !== undefined && value !== null && typeof value !== 'string') ||
      !metadata || typeof metadata !== 'object' || Array.isArray(metadata) ||
      [priceId, tier, service].filter(Boolean).length !== 1) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Select one service or membership plan.' }) };
  }
  tier = tier?.toLowerCase();
  service = service?.toLowerCase();
  if ((tier && !Object.hasOwn(TIER_PRICES, tier)) || (service && !Object.hasOwn(SERVICE_PRICES, service))) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown service or membership plan.' }) };
  }

  // Resolve priceId from tier for membership flows (client never needs to know price IDs)
  if (!priceId && tier) {
    priceId = TIER_PRICES[tier?.toLowerCase()];
    mode = 'subscription';
    metadata.tier = tier;
  }

  // Resolve priceId from service slug for service flows
  if (!priceId && service) {
    priceId = SERVICE_PRICES[service?.toLowerCase()];
    mode = service === 'monthly-retainer' ? 'subscription' : 'payment';
    metadata.service = service;
  }

  // Allowlist check — never let arbitrary price IDs through
  if ((tier || service) && !priceId) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Online payment for this selection is temporarily unavailable. Please contact mark@mgcglobalconsulting.com.' }) };
  }
  if (!priceId || !ALLOWED_PRICES.has(priceId)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid price' }) };
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Online checkout is temporarily unavailable. Please contact mark@mgcglobalconsulting.com.' }) };
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 20000, maxNetworkRetries: 1 });
    const siteUrl = new URL(process.env.SITE_URL || 'https://mgcglobalconsulting.com');
    if (siteUrl.protocol !== 'https:' || !['mgcglobalconsulting.com', 'www.mgcglobalconsulting.com'].includes(siteUrl.hostname)) {
      throw new Error('Invalid checkout return origin');
    }
    const cancelParams = new URLSearchParams({ cancelled: 'true' });
    if (tier) cancelParams.set('tier', tier);
    else if (service) cancelParams.set('service', service);
    else cancelParams.set('priceId', priceId);
    // Stripe decides one-time vs subscription: a recurring price in 'payment' mode is rejected.
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active) throw new Error(`Price ${priceId} is archived`);
    mode = price.recurring ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      mode,                           // 'payment' or 'subscription'
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      success_url: `${siteUrl.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl.origin}/checkout?${cancelParams}`,
      metadata: {
        source: 'mgc-website',
        ...metadata,
      },
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      custom_text: {
        submit: {
          message: 'You will receive a confirmation email and our team will reach out within 24 hours.',
        },
      },
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ url: session.url, sessionId: session.id }),
    };
  } catch (err) {
    console.error('[create-checkout]', err.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Checkout session creation failed' }),
    };
  }
};
