'use strict';
/**
 * Motions / Frontend Success Animation Trigger
 * ─────────────────────────────────────────────
 * POSTs a signed event to the MGC frontend so it can
 * trigger a "Success Motion" (UI celebration animation)
 * on the client's dashboard or the success.html page.
 *
 * The frontend must expose FRONTEND_SUCCESS_WEBHOOK_URL and
 * verify the X-MGC-Signature header (HMAC-SHA256 of the body).
 */

const crypto = require('crypto');
const axios  = require('axios');
const log    = require('./logger');

/**
 * Trigger the Success Motion on the frontend.
 * @param {Object} event - Normalized PaymentEvent
 */
async function triggerSuccessMotion(event) {
  const url    = process.env.FRONTEND_SUCCESS_WEBHOOK_URL;
  const secret = process.env.FRONTEND_SUCCESS_SECRET;

  if (!url) {
    log.warn('Motions', 'FRONTEND_SUCCESS_WEBHOOK_URL not set — skipping motion trigger');
    return;
  }

  const payload = JSON.stringify({
    type:         'PAYMENT_SUCCESS',
    paymentId:    event.paymentId,
    customerName: event.customerName,
    amount:       event.amount,
    currency:     event.currency,
    invoiceNum:   event.invoiceNum ?? event.invoiceId,
    timestamp:    new Date().toISOString(),
  });

  const signature = secret
    ? crypto.createHmac('sha256', secret).update(payload).digest('hex')
    : 'unsigned';

  const { status } = await axios.post(url, payload, {
    headers: {
      'Content-Type':   'application/json',
      'X-MGC-Signature': signature,
    },
    timeout: 5000,
  });

  log.info('Motions', `Success motion triggered`, { status, url });
}

module.exports = { triggerSuccessMotion };
