# Julian Vance — Newsletter

- Template ID: `julian-vance-accounting/newsletter/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Julian Vance
- Audience: Eligible subscribed contact
- Trigger: Approved billing education newsletter
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: marketing
- Required content fields: `approved_billing_update`, `approved_mailing_address`, `billing_action`, `edition`, `first_name`, `resource_title_and_url`, `verified_subscription_context`, `verified_unsubscribe_url`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

MGC Billing Notes | {{edition}}

## Body

Hi {{first_name}},

This edition of MGC Billing Notes focuses on making billing administration easier.

Billing process update: {{approved_billing_update}}
Helpful resource: {{resource_title_and_url}}
Action, if applicable: {{billing_action}}

A practical habit: keep the invoice number, engagement reference, and billing contact together when raising a billing question. That helps the team find the right record quickly.

For questions about your account, reply with the invoice reference. Account balances and payment instructions should be reviewed in your secure billing record.

You’re receiving this because {{verified_subscription_context}}.
Manage preferences or unsubscribe: {{verified_unsubscribe_url}}
MGC Global Consulting LLC | {{approved_mailing_address}}

Julian Vance
MGC Global Consulting | Accounting & Financial Systems
AI team assistant
https://www.mgcglobalconsulting.com
