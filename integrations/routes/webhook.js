'use strict';
/**
 * QuickBooks Webhook Route
 * ────────────────────────
 * POST /webhooks/quickbooks
 *
 * Receives QB payment events, verifies the signature,
 * then fans out to all downstream integrations in parallel.
 */

const express = require('express');
const router  = express.Router();

const { verifyWebhookSignature, parseWebhookEvent } = require('../lib/quickbooks');
const { appendPayment }        = require('../lib/sheets');
const { notifyPaymentReceived} = require('../lib/slack');
const { sendPaymentConfirmation } = require('../lib/whatsapp');
const { markClientPaid }       = require('../lib/notion');
const { triggerSuccessMotion } = require('../lib/motions');
const log = require('../lib/logger');

// QB sends raw JSON — capture raw body for signature verification
router.post(
  '/quickbooks',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['intuit-signature'] ?? '';
    const rawBody = req.body; // Buffer

    /* ── 1. Verify webhook signature ───────────────────────── */
    if (!verifyWebhookSignature(rawBody, sig)) {
      log.warn('Webhook', 'Invalid signature — rejected');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // QB requires a 200 back immediately
    res.status(200).json({ received: true });

    /* ── 2. Parse events ────────────────────────────────────── */
    let body;
    try {
      body = JSON.parse(rawBody.toString('utf-8'));
    } catch {
      log.error('Webhook', 'Failed to parse QB webhook body');
      return;
    }

    let paymentEvents;
    try {
      paymentEvents = await parseWebhookEvent(body);
    } catch (err) {
      log.error('Webhook', 'QB event parsing failed', err.message);
      return;
    }

    if (!paymentEvents.length) {
      log.info('Webhook', 'No payment events in this notification');
      return;
    }

    /* ── 3. Fan out to all integrations ─────────────────────── */
    for (const event of paymentEvents) {
      log.info('Webhook', `Processing payment ${event.paymentId} — $${event.amount} from ${event.customerName}`);

      const results = await Promise.allSettled([
        appendPayment(event),
        notifyPaymentReceived(event),
        sendPaymentConfirmation(event),
        markClientPaid(event),
        triggerSuccessMotion(event),
      ]);

      const labels = ['Sheets', 'Slack', 'WhatsApp', 'Notion', 'Motions'];
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          log.error('Webhook', `${labels[i]} integration failed for ${event.paymentId}`, r.reason?.message);
        } else {
          log.info('Webhook', `${labels[i]} ✓`);
        }
      });

      const failed = results.filter(r => r.status === 'rejected').length;
      log.info('Webhook', `Payment ${event.paymentId} processed — ${results.length - failed}/${results.length} integrations succeeded`);
    }
  }
);

/* ── Health / test endpoint ─────────────────────────────────────── */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MGC Payment Hub',
    timestamp: new Date().toISOString(),
    integrations: ['QuickBooks', 'Google Sheets', 'Slack', 'WhatsApp', 'Notion', 'Motions'],
  });
});

module.exports = router;
