'use strict';
/**
 * WhatsApp Integration (Twilio WhatsApp Business API)
 * ───────────────────────────────────────────────────
 * Sends a "Payment Confirmed" WhatsApp message to the customer
 * and an internal copy to the MGC admin number.
 */

const twilio = require('twilio');
const log    = require('./logger');

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Format a customer-facing WhatsApp confirmation message.
 */
function customerMessage(event) {
  const amount = `$${Number(event.amount).toFixed(2)}`;
  const inv    = event.invoiceNum ?? event.invoiceId ?? 'N/A';
  return (
    `✅ *Payment Confirmed — MGC Global Consulting*\n\n` +
    `Hi ${event.customerName},\n\n` +
    `We've received your payment of *${amount}* ` +
    `(Invoice #${inv}). Thank you!\n\n` +
    `Your account is now marked as *Paid* and our team will ` +
    `follow up with your next steps shortly.\n\n` +
    `Questions? Reply to this message or email us at ` +
    `hello@mgcglobalconsulting.com\n\n` +
    `— The MGC Team`
  );
}

/**
 * Format an internal admin alert.
 */
function adminMessage(event) {
  const amount = `$${Number(event.amount).toFixed(2)}`;
  return (
    `💰 *MGC Payment Alert*\n\n` +
    `*Customer:* ${event.customerName}\n` +
    `*Amount:* ${amount}\n` +
    `*Invoice:* ${event.invoiceNum ?? event.invoiceId ?? 'N/A'}\n` +
    `*Email:* ${event.customerEmail ?? '—'}\n` +
    `*QB ID:* ${event.paymentId}\n\n` +
    `Sheets ✓ | Slack ✓ | Notion ✓`
  );
}

/**
 * Normalize a phone number to WhatsApp E.164 format.
 * e.g. "(410) 555-1234" → "whatsapp:+14105551234"
 */
function normalizeWhatsApp(phone) {
  if (!phone) return null;
  if (phone.startsWith('whatsapp:')) return phone;
  const digits = phone.replace(/\D/g, '');
  const e164   = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
  return `whatsapp:${e164}`;
}

/**
 * Send WhatsApp messages for a payment event.
 * @param {Object} event - Normalized PaymentEvent
 */
async function sendPaymentConfirmation(event) {
  const client     = getClient();
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
  const adminTo    = process.env.MGC_ADMIN_WHATSAPP;
  const customerTo = normalizeWhatsApp(event.customerPhone);

  const sends = [];

  // Customer message (only if we have a phone number)
  if (customerTo) {
    sends.push(
      client.messages.create({
        from: fromNumber,
        to:   customerTo,
        body: customerMessage(event),
      }).then(msg => {
        log.info('WhatsApp', `Customer message sent`, { sid: msg.sid, to: customerTo });
      })
    );
  } else {
    log.warn('WhatsApp', `No customer phone number — skipping customer WhatsApp`);
  }

  // Internal admin alert
  if (adminTo) {
    sends.push(
      client.messages.create({
        from: fromNumber,
        to:   adminTo,
        body: adminMessage(event),
      }).then(msg => {
        log.info('WhatsApp', `Admin alert sent`, { sid: msg.sid });
      })
    );
  }

  const results = await Promise.allSettled(sends);
  results.forEach(r => {
    if (r.status === 'rejected') {
      log.error('WhatsApp', 'Send failed', r.reason?.message);
    }
  });
}

module.exports = { sendPaymentConfirmation };
