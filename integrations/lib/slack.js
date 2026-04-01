'use strict';
/**
 * Slack Integration
 * ─────────────────
 * Sends a rich "Payment Received" notification to #payments.
 * Uses Slack Web API (chat.postMessage) via bot token.
 */

const axios = require('axios');
const log   = require('./logger');

const SLACK_API = 'https://slack.com/api/chat.postMessage';

/**
 * Post a payment notification to the #payments Slack channel.
 * @param {Object} event - Normalized PaymentEvent
 */
async function notifyPaymentReceived(event) {
  const channel = process.env.SLACK_PAYMENTS_CHANNEL || '#payments';
  const amount  = `$${Number(event.amount).toFixed(2)}`;
  const date    = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '💰 Payment Received — MGC Global Consulting', emoji: true },
    },
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Customer*\n${event.customerName}` },
        { type: 'mrkdwn', text: `*Amount*\n${amount} ${event.currency}` },
        { type: 'mrkdwn', text: `*Invoice #*\n${event.invoiceNum ?? event.invoiceId ?? 'N/A'}` },
        { type: 'mrkdwn', text: `*Date*\n${date}` },
        { type: 'mrkdwn', text: `*Email*\n${event.customerEmail ?? '—'}` },
        { type: 'mrkdwn', text: `*QB Payment ID*\n${event.paymentId}` },
      ],
    },
    ...(event.memo ? [{
      type: 'section',
      text: { type: 'mrkdwn', text: `*Memo:* ${event.memo}` },
    }] : []),
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `✅ Google Sheets updated  |  📲 WhatsApp sent  |  📋 Notion marked Paid` },
        { type: 'mrkdwn', text: `_Automated by MGC Payment Hub — ${new Date().toISOString()}_` },
      ],
    },
  ];

  const { data } = await axios.post(
    SLACK_API,
    { channel, blocks, text: `Payment received: ${amount} from ${event.customerName}` },
    {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  log.info('Slack', `Notification sent to ${channel}`, { ts: data.ts });
}

module.exports = { notifyPaymentReceived };
