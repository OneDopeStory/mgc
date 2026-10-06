# Slack and QuickBooks setup (owner steps)

Written 2026-10-05. Variable names match the code in `netlify/functions/`. In Netlify, add every value under Project configuration, then Environment variables. Use "Same value for all deploy contexts" and keep **Functions** in scopes. Netlify only picks up a change on the next deploy.

## Slack (the TrueAssist app)

1. Go to https://api.slack.com/apps, open **TrueAssist** (or click Create New App, then From scratch, and pick the mgcglobalconsulting workspace).
2. **OAuth & Permissions**, then Bot Token Scopes. Add `chat:write`, `chat:write.customize`, `channels:history`, `groups:history`, `reactions:read` and `users:read` (shows who posted in the dashboard's live Slack panel). Click **Install to Workspace** (or Reinstall) and allow it.
3. Copy the **Bot User OAuth Token** (starts with `xoxb-`) into Netlify as `SLACK_BOT_TOKEN`.
4. **Basic Information**, then App Credentials. Copy the **Signing Secret** into Netlify as `SLACK_SIGNING_SECRET`.
5. In Netlify, also set:
   - `SLACK_RELAY_CHANNEL_ID` = `C0C6WRFRK44` (#site-inquiries, where TrueAssist hands chats to you)
   - `SLACK_CHANNEL_MAP` = `{"inquiries":"C0C6WRFRK44","clients":"C0C6Y1W42JD","billing":"C0C6U59GR7G","outreach":"C0C7QF0TF96","approvals":"C0C6PSZGKEF","ops":"C0C6Y2PPVG9"}` (skip if it's already set)
   - `SLACK_NOTIFY_SECRET`: already set. Keep it; you need the same value in step 8.
6. **Event Subscriptions**: turn it on. Set the Request URL to `https://mgcglobalconsulting.com/api/slack/events`. It shows Verified once a deploy with `SLACK_SIGNING_SECRET` is live. Under Subscribe to bot events, add `message.channels` and `message.groups`. Save, then reinstall if Slack asks. This also feeds the Command Center's live inbox: every message people post in the six routed channels is logged there. Bot cards are logged when they're sent.
7. In Slack, type `/invite @TrueAssist` in each channel: #site-inquiries, #clients, #billing, #outreach, #approvals and #ops-alerts.
8. **Supabase database webhooks, done with SQL instead of 8 dashboard clicks.** In Supabase (bjnpib, SQL Editor):
   1. Run this once, pasting the `SLACK_NOTIFY_SECRET` value from Netlify between the quotes. It stores the secret in Supabase Vault, so it never sits in a file:
      `select vault.create_secret('PASTE_SLACK_NOTIFY_SECRET_HERE', 'mgc_webhook_secret');`
   2. Paste all of `supabase/migrations/20261005220000_command_center.sql` and click Run. It creates the Command Center tables and wires every new lead, booking, client profile, message, upload and questionnaire to Slack. New leads and questionnaires also get 4 tailored ideas for the dashboard.
   3. If you already created webhooks by hand under Database, then Webhooks, delete those. Otherwise every card posts twice.
9. Optional: `SLACK_PAYMENTS_WEBHOOK` is an Incoming Webhook URL (App, then Incoming Webhooks, add to #billing) for invoice-request cards.

**Check it:** submit the contact form or sign up in the portal. A card should appear in #site-inquiries or #clients within a few seconds.

## QuickBooks Online

Background from Intuit's docs (OAuth 2.0 FAQ):
- Access tokens last 60 minutes.
- Refresh tokens last 100 days, but the value changes about every 24 hours and the old one goes stale.
- After 5 years, or 100 days without use, you have to reconnect.

Because of the rotation, a fixed `QB_REFRESH_TOKEN` in Netlify would stop working within a day of the first invoice. `request-invoice.js` now saves each new refresh token to the Supabase table `mgc_integration_tokens`. Run `supabase/migrations/20261005210000_integration_tokens.sql` once in the Supabase SQL Editor to create it.

1. Go to https://developer.intuit.com, sign in with the Intuit account that owns your QuickBooks company, open **My Hub**, then **App dashboard**, and create an app (QuickBooks Online and Payments). Give it the **Accounting** scope (`com.intuit.quickbooks.accounting`). If you already have an app, open it.
2. **Keys & credentials**. Production keys need Intuit's short app questionnaire first. It asks for a privacy policy URL (`https://mgcglobalconsulting.com/privacy`) and an end-user license or terms URL. To test before that, use the **Development (sandbox)** keys and set `QB_ENVIRONMENT=sandbox`.
3. While you're on Keys & credentials, **rotate the client secret**. The old one was committed to `.env.template` in git (see CLAUDE.md, Security rules). Then copy:
   - Client ID → `QB_CLIENT_ID`
   - Client Secret → `QB_CLIENT_SECRET`
4. Under Redirect URIs, add `https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl` and save.
5. Open the **OAuth 2.0 Playground** (https://developer.intuit.com/app/developer/playground).
   1. Pick your app and the matching environment, and tick **Accounting**.
   2. Click **Get authorization code**, sign in, choose your MGC company and click Connect.
   3. Click **Get tokens**.
   4. Copy the **Refresh Token** → `QB_REFRESH_TOKEN`, and the **Realm ID** (the company ID) → `QB_REALM_ID`.
6. Set `QB_ENVIRONMENT` to `production` (or `sandbox` if you used sandbox keys).
7. Tell Claude, and it will build a preview and test one invoice request in sandbox before you go live.

**About the custom fields link you sent** (`appFoundationsCustomFieldDefinitions`, Intuit's GraphQL API): that query lists the custom fields defined in your QuickBooks company. It's useful later for tagging invoices with things like the service line or the portal client ID. It isn't needed for invoices to work, and it uses Intuit's newer GraphQL API with extra scopes. Leave it until the basic invoice flow above works.
