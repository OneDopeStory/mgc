'use strict';
/**
 * Local Webhook Test Script
 * ─────────────────────────
 * Simulates a QuickBooks payment webhook POST to the local server.
 * Generates a valid HMAC-SHA256 signature using QB_WEBHOOK_VERIFIER_TOKEN.
 *
 * Usage:
 *   node scripts/test-webhook.js
 *   npm run test:webhook
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env.local') });

const crypto = require('crypto');
const http   = require('http');

const PORT   = process.env.PORT || 3001;
const TOKEN  = process.env.QB_WEBHOOK_VERIFIER_TOKEN || 'test-token';

/* ── Sample QB payment webhook payload ──────────────────────────────── */
const payload = JSON.stringify({
  eventNotifications: [
    {
      realmId: process.env.QB_REALM_ID || '1234567890',
      dataChangeEvent: {
        entities: [
          {
            name:      'Payment',
            id:        'test-payment-001',
            operation: 'Create',
            lastUpdated: new Date().toISOString(),
          },
        ],
      },
    },
  ],
});

/* ── Sign the payload ────────────────────────────────────────────────── */
const signature = crypto
  .createHmac('sha256', TOKEN)
  .update(payload)
  .digest('base64');

/* ── POST to local server ────────────────────────────────────────────── */
const options = {
  hostname: 'localhost',
  port:     PORT,
  path:     '/webhooks/quickbooks',
  method:   'POST',
  headers: {
    'Content-Type':      'application/json',
    'Content-Length':    Buffer.byteLength(payload),
    'intuit-signature':  signature,
  },
};

console.log(`\n📤 Sending test webhook to http://localhost:${PORT}/webhooks/quickbooks`);
console.log(`   Signature: ${signature}`);
console.log(`   Payload:   ${payload}\n`);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`✅ Response ${res.statusCode}: ${data}`);
  });
});

req.on('error', (err) => {
  console.error(`\n❌ Request failed: ${err.message}`);
  console.error('   Is the server running? Try: npm start\n');
});

req.write(payload);
req.end();
