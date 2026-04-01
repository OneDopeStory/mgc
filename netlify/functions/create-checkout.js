'use strict';
/**
 * MGC Global Consulting — Stripe Checkout Session Creator
 * ────────────────────────────────────────────────────────
 * POST /.netlify/functions/create-checkout
 * Body: { priceId, mode, customerEmail?, metadata? }
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICES = new Set([
  // Membership tiers
  process.env.STRIPE_PRICE_MEMBERSHIP_STARTER,
  process.env.STRIPE_PRICE_MEMBERSHIP_PRO,
  process.env.STRIPE_PRICE_MEMBERSHIP_ELITE,
  // Services (one-time)
  process.env.STRIPE_PRICE_AI_CONSULTING_ASSESSMENT,
  process.env.STRIPE_PRICE_AI_CONSULTING_ROADMAP,
  process.env.STRIPE_PRICE_AUTOMATION_STARTER,
  process.env.STRIPE_PRICE_AUTOMATION_FULL,
  process.env.STRIPE_PRICE_CRM_AUDIT,
  process.env.STRIPE_PRICE_CRM_BUILD,
  process.env.STRIPE_PRICE_WORKSHOP_HALF,
  process.env.STRIPE_PRICE_WORKSHOP_FULL,
  process.env.STRIPE_PRICE_RETAINER,
  process.env.STRIPE_PRICE_SYSTEMS_DESIGN,
]);

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

  const { priceId, mode = 'payment', customerEmail, metadata = {} } = body;

  // Allowlist check — never let arbitrary price IDs through
  if (!priceId || !ALLOWED_PRICES.has(priceId)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid price' }) };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode,                           // 'payment' or 'subscription'
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      success_url: `${process.env.SITE_URL}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.SITE_URL}/checkout.html?cancelled=true`,
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
