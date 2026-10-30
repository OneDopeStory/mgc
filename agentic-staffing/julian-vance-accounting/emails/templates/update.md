# Julian Vance — Update

- Template ID: `julian-vance-accounting/update/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Julian Vance
- Audience: Verified contact for this engagement
- Trigger: Reconciled invoice status change
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `billing_next_action`, `first_name`, `invoice_number`, `verified_at`, `verified_balance_and_currency`, `verified_due_date`, `verified_invoice_status`, `verified_invoice_url`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

Billing status | Invoice {{invoice_number}}

## Body

Hi {{first_name}},

Here is the verified status of invoice {{invoice_number}} as of {{verified_at}}.

Invoice status: {{verified_invoice_status}}
Outstanding amount and currency: {{verified_balance_and_currency}}
Due date shown on the invoice: {{verified_due_date}}
Secure invoice link: {{verified_invoice_url}}
Next action: {{billing_next_action}}

If your records differ, reply with the invoice reference so we can investigate. Please do not include payment credentials in your reply.

Julian Vance
MGC Global Consulting | Accounting & Financial Systems
AI team assistant
https://www.mgcglobalconsulting.com
