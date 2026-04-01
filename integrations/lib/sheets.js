'use strict';
/**
 * Google Sheets Integration
 * ─────────────────────────
 * Appends payment rows to two spreadsheets:
 *   1. Payment Page spreadsheet  (financial record)
 *   2. System Integrations sheet (audit/ops log)
 *
 * Auth: Service Account with Editor access to both sheets.
 */

const { google } = require('googleapis');
const log        = require('./logger');

function getAuth() {
  const keyJson = Buffer.from(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64,
    'base64'
  ).toString('utf-8');

  const key = JSON.parse(keyJson);

  return new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/spreadsheets'],
    null
  );
}

/**
 * Append a payment event to both Google Sheets.
 * @param {Object} event - Normalized PaymentEvent from QB parser
 */
async function appendPayment(event) {
  const auth   = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const timestamp = new Date().toISOString();

  /* ── Row format: Payment Page ─────────────────────────────── */
  const paymentRow = [
    timestamp,                           // A: Timestamp
    event.paymentId,                     // B: QB Payment ID
    event.invoiceNum ?? event.invoiceId, // C: Invoice #
    event.customerName,                  // D: Customer Name
    event.customerEmail ?? '',           // E: Email
    event.customerPhone ?? '',           // F: Phone
    `$${Number(event.amount).toFixed(2)}`, // G: Amount
    event.currency,                      // H: Currency
    event.date,                          // I: QB Transaction Date
    event.memo ?? '',                    // J: Memo
    'QuickBooks',                        // K: Source
    'Confirmed',                         // L: Status
  ];

  /* ── Row format: System Integrations log ─────────────────── */
  const integrationRow = [
    timestamp,                           // A: Timestamp
    'PAYMENT_RECEIVED',                  // B: Event Type
    event.paymentId,                     // C: Reference ID
    event.customerName,                  // D: Entity
    `$${Number(event.amount).toFixed(2)}`, // E: Amount
    'Slack ✓ | WhatsApp ✓ | Notion ✓',  // F: Notifications sent
    'Success',                           // G: Hub Status
  ];

  const paymentSpreadsheetId    = process.env.GOOGLE_SHEETS_PAYMENT_SPREADSHEET_ID;
  const integrationsSpreadsheetId = process.env.GOOGLE_SHEETS_INTEGRATIONS_SPREADSHEET_ID;
  const paymentTab              = process.env.GOOGLE_SHEETS_PAYMENT_TAB || 'Payments';
  const integrationsTab         = process.env.GOOGLE_SHEETS_INTEGRATIONS_TAB || 'Payment Log';

  const results = await Promise.allSettled([
    sheets.spreadsheets.values.append({
      spreadsheetId: paymentSpreadsheetId,
      range:         `${paymentTab}!A:L`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [paymentRow] },
    }),
    sheets.spreadsheets.values.append({
      spreadsheetId: integrationsSpreadsheetId,
      range:         `${integrationsTab}!A:G`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [integrationRow] },
    }),
  ]);

  results.forEach((result, i) => {
    const label = i === 0 ? 'Payment Sheet' : 'Integrations Sheet';
    if (result.status === 'fulfilled') {
      log.info('Sheets', `Appended row to ${label}`);
    } else {
      log.error('Sheets', `Failed to append to ${label}`, result.reason?.message);
    }
  });
}

module.exports = { appendPayment };
