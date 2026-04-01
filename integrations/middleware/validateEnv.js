'use strict';
/**
 * Environment variable validator.
 * Fails fast at startup if critical vars are missing.
 */

const REQUIRED = [
  'QB_CLIENT_ID',
  'QB_CLIENT_SECRET',
  'QB_REFRESH_TOKEN',
  'QB_REALM_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_SERVICE_ACCOUNT_KEY_B64',
  'GOOGLE_SHEETS_PAYMENT_SPREADSHEET_ID',
  'GOOGLE_SHEETS_INTEGRATIONS_SPREADSHEET_ID',
  'SLACK_BOT_TOKEN',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_FROM',
  'NOTION_API_KEY',
  'NOTION_CLIENTS_DATABASE_ID',
];

module.exports = function validateEnv() {
  const missing = REQUIRED.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables:\n  ${missing.join('\n  ')}\n`);
    console.error('Copy .env.template to .env and fill in all values.\n');
    process.exit(1);
  }
};
