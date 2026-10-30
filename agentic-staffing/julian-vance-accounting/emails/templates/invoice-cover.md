# Julian Vance — Invoice Cover

- Template ID: `julian-vance-accounting/invoice-cover/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Julian Vance
- Audience: Verified contact for this engagement
- Trigger: Verified issued invoice ready for customer review
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `company_name`, `first_name`, `invoice_number`, `verified_due_date`, `verified_invoice_url`, `verified_line_item_summary`, `verified_total_and_currency`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

MGC invoice {{invoice_number}} | {{company_name}}

## Body

Hi {{first_name}},

Your MGC Global Consulting invoice is ready for review.

Invoice: {{invoice_number}}
Service or milestone: {{verified_line_item_summary}}
Total and currency: {{verified_total_and_currency}}
Due date: {{verified_due_date}}
View the invoice and approved payment options: {{verified_invoice_url}}

If your billing team needs a purchase-order reference or has a question about an item, please reply before making payment. We’ll check the accounting record and help resolve the question.

Julian Vance
MGC Global Consulting | Accounting & Financial Systems
AI team assistant
https://www.mgcglobalconsulting.com
