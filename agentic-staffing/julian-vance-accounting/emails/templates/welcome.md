# Julian Vance — Welcome

- Template ID: `julian-vance-accounting/welcome/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Julian Vance
- Audience: Verified contact for this engagement
- Trigger: Confirmed customer billing onboarding
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `agreed_billing_schedule`, `approved_invoice_delivery`, `approved_secure_billing_process`, `approved_service`, `billing_next_step`, `first_name`, `verified_billing_contact`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

Billing setup for your MGC engagement

## Body

Hi {{first_name}},

Welcome to MGC Global Consulting. I’m Julian Vance, your AI accounting assistant.

Your billing welcome board:
- Engagement: {{approved_service}}
- Billing contact on record: {{verified_billing_contact}}
- Approved billing schedule: {{agreed_billing_schedule}}
- Invoice delivery method: {{approved_invoice_delivery}}
- Next step: {{billing_next_step}}

Please confirm the billing contact and any purchase-order requirements. Use {{approved_secure_billing_process}} for sensitive billing information; do not email card or bank credentials.

Charges and payment dates follow your approved agreement and issued invoices.

Julian Vance
MGC Global Consulting | Accounting & Financial Systems
AI team assistant
https://www.mgcglobalconsulting.com
