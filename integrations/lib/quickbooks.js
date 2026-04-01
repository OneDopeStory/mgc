'use strict';
/**
 * QuickBooks Integration
 * ─────────────────────
 * Verifies incoming QB webhook signatures and fetches full
 * payment/invoice details from the QB Accounting API using
 * OAuth2 client credentials + refresh token flow.
 */

const crypto = require('crypto');
const axios  = require('axios');
const log    = require('./logger');

const QB_API_BASE = process.env.QB_ENVIRONMENT === 'sandbox'
  ? 'https://sandbox-quickbooks.api.intuit.com'
  : 'https://quickbooks.api.intuit.com';

const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

let _accessToken  = null;
let _tokenExpiry  = 0;

/* ── Token management ─────────────────────────────────────────── */
async function getAccessToken() {
  if (_accessToken && Date.now() < _tokenExpiry - 60_000) {
    return _accessToken;
  }

  const creds = Buffer.from(
    `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
  ).toString('base64');

  const { data } = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: process.env.QB_REFRESH_TOKEN,
    }),
    {
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    }
  );

  _accessToken = data.access_token;
  _tokenExpiry = Date.now() + data.expires_in * 1000;

  log.info('QuickBooks', 'Access token refreshed', { expires_in: data.expires_in });
  return _accessToken;
}

/* ── Webhook signature verification ───────────────────────────── */
function verifyWebhookSignature(rawBody, signatureHeader) {
  const verifier = process.env.QB_WEBHOOK_VERIFIER_TOKEN;
  if (!verifier) {
    log.warn('QuickBooks', 'WEBHOOK_VERIFIER_TOKEN not set — skipping signature check');
    return true;
  }

  const expected = crypto
    .createHmac('sha256', verifier)
    .update(rawBody)
    .digest('base64');

  const valid = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader || '')
  );

  if (!valid) log.warn('QuickBooks', 'Webhook signature mismatch');
  return valid;
}

/* ── Fetch Payment details ─────────────────────────────────────── */
async function fetchPayment(paymentId) {
  const token   = await getAccessToken();
  const realmId = process.env.QB_REALM_ID;
  const url     = `${QB_API_BASE}/v3/company/${realmId}/payment/${paymentId}`;

  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return data.Payment;
}

/* ── Fetch Invoice details ─────────────────────────────────────── */
async function fetchInvoice(invoiceId) {
  const token   = await getAccessToken();
  const realmId = process.env.QB_REALM_ID;
  const url     = `${QB_API_BASE}/v3/company/${realmId}/invoice/${invoiceId}`;

  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return data.Invoice;
}

/* ── Fetch Customer details ────────────────────────────────────── */
async function fetchCustomer(customerId) {
  const token   = await getAccessToken();
  const realmId = process.env.QB_REALM_ID;
  const url     = `${QB_API_BASE}/v3/company/${realmId}/customer/${customerId}`;

  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return data.Customer;
}

/* ── Parse webhook event into a clean PaymentEvent ────────────── */
async function parseWebhookEvent(webhookBody) {
  const events = webhookBody?.eventNotifications ?? [];

  const paymentEvents = [];

  for (const notification of events) {
    const dataChanges = notification?.dataChangeEvent?.entities ?? [];
    for (const entity of dataChanges) {
      if (entity.name === 'Payment' && entity.operation === 'Create') {
        try {
          const payment  = await fetchPayment(entity.id);
          const invoiceId = payment?.Line?.[0]?.LinkedTxn?.find(
            t => t.TxnType === 'Invoice'
          )?.TxnId;

          let customer  = null;
          let invoice   = null;

          if (payment.CustomerRef?.value) {
            customer = await fetchCustomer(payment.CustomerRef.value);
          }
          if (invoiceId) {
            invoice = await fetchInvoice(invoiceId);
          }

          paymentEvents.push({
            paymentId:    payment.Id,
            amount:       payment.TotalAmt,
            currency:     'USD',
            date:         payment.TxnDate,
            customerName: customer?.DisplayName ?? payment.CustomerRef?.name ?? 'Unknown',
            customerEmail: customer?.PrimaryEmailAddr?.Address ?? null,
            customerPhone: customer?.PrimaryPhone?.FreeFormNumber ?? null,
            invoiceId:    invoiceId ?? null,
            invoiceNum:   invoice?.DocNumber ?? null,
            memo:         payment.PrivateNote ?? '',
            raw:          payment,
          });

          log.info('QuickBooks', `Parsed payment ${payment.Id}`, {
            amount: payment.TotalAmt,
            customer: customer?.DisplayName,
          });

        } catch (err) {
          log.error('QuickBooks', `Failed to fetch payment ${entity.id}`, err.message);
        }
      }
    }
  }

  return paymentEvents;
}

module.exports = { verifyWebhookSignature, parseWebhookEvent, fetchPayment, fetchCustomer };
