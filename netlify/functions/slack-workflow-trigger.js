'use strict';
/**
 * MGC Global Consulting — Slack Workflow Builder triggers
 *
 * Calls the webhook triggers defined in
 * agentic-staffing/alex-trueassist-orchestrator/tools/mgc-lead-workflow (Deno Slack SDK app
 * "mgc-lead-workflow", A0CD6R0KQAX). Each trigger starts a Slack-hosted workflow — this needs
 * no SLACK_BOT_TOKEN, unlike postToSlack() in slack-notify.js.
 *
 * Env:
 *   SLACK_NEW_LEAD_TRIGGER_URL          https://hooks.slack.com/triggers/... webhook URL for the
 *                                       "New lead notification" trigger. Unset means skipped, never
 *                                       a failed request — same convention as postToTelegram().
 *   SLACK_CLIENT_ONBOARDING_TRIGGER_URL same, for the "Client onboarding" trigger.
 *   SLACK_INQUIRIES_CHANNEL_ID          channel the lead workflow posts into (already used by slack-notify.js).
 *   SLACK_CLIENTS_CHANNEL_ID            channel the onboarding workflow posts into (maps to the
 *                                       "clients" entry in slack-notify.js's SLACK_CHANNEL_MAP).
 */

async function triggerNewLeadWorkflow({ name, email, company, service, message, source }) {
  const url = process.env.SLACK_NEW_LEAD_TRIGGER_URL;
  const channel = process.env.SLACK_INQUIRIES_CHANNEL_ID;
  if (!url || !channel) return { skipped: true };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel,
      lead_name: name || '',
      lead_email: email || '',
      lead_company: company || '',
      lead_service: service || '',
      lead_message: message || '',
      lead_source: source || '',
    }),
  });
  if (!res.ok) throw new Error(`Slack trigger ${res.status}: ${await res.text()}`);
  return { skipped: false };
}

async function triggerClientOnboardingWorkflow({ name, email, company, phone, membershipTier, onboardingStatus }) {
  const url = process.env.SLACK_CLIENT_ONBOARDING_TRIGGER_URL;
  const channel = process.env.SLACK_CLIENTS_CHANNEL_ID;
  if (!url || !channel) return { skipped: true };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel,
      client_name: name || '',
      client_email: email || '',
      client_company: company || '',
      client_phone: phone || '',
      membership_tier: membershipTier || '',
      onboarding_status: onboardingStatus || '',
    }),
  });
  if (!res.ok) throw new Error(`Slack trigger ${res.status}: ${await res.text()}`);
  return { skipped: false };
}

exports.triggerNewLeadWorkflow = triggerNewLeadWorkflow;
exports.triggerClientOnboardingWorkflow = triggerClientOnboardingWorkflow;
