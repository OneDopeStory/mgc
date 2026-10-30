# Jordan Hayes — Newsletter

- Template ID: `jordan-hayes-custops/newsletter/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Jordan Hayes
- Audience: Eligible subscribed contact
- Trigger: Approved customer operations newsletter
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: marketing
- Required content fields: `approved_mailing_address`, `client_call_to_action`, `confirmed_dates`, `edition`, `first_name`, `resource_title_and_url`, `verified_client_news`, `verified_subscription_context`, `verified_unsubscribe_url`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

MGC Client Connection | {{edition}}

## Body

Hi {{first_name}},

Here is your MGC Client Connection for {{edition}}.

What’s new: {{verified_client_news}}
A useful resource: {{resource_title_and_url}}
Dates to keep in view: {{confirmed_dates}}
One practical tip: keep your project priorities, decision owner, and outstanding questions together in your approved workspace.

Your next step: {{client_call_to_action}}

Need help finding the right person? Reply with your question and we’ll route it to the appropriate MGC team.

You’re receiving this because {{verified_subscription_context}}.
Manage preferences or unsubscribe: {{verified_unsubscribe_url}}
MGC Global Consulting LLC | {{approved_mailing_address}}

Jordan Hayes
MGC Global Consulting | Customer Operations & Dispatch
AI team assistant
https://www.mgcglobalconsulting.com
