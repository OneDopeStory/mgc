# David Ken — Update

- Template ID: `david-kim-techsupport/update/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: David Ken
- Audience: Verified contact for this engagement
- Trigger: Verified support investigation or resolution change
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `confirmed_impact`, `confirmed_issue`, `confirmed_next_update`, `first_name`, `next_action_and_owner`, `ticket_reference`, `verified_at`, `verified_checks`, `verified_status`, `verified_workaround_or_none`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

Support update | {{ticket_reference}}

## Body

Hi {{first_name}},

Here is the latest on {{ticket_reference}}, checked at {{verified_at}}.

Issue: {{confirmed_issue}}
Current status: {{verified_status}}
What we have checked: {{verified_checks}}
Impact: {{confirmed_impact}}
Approved workaround, if any: {{verified_workaround_or_none}}
Next action and owner: {{next_action_and_owner}}
Next update: {{confirmed_next_update}}

If the symptoms change, please reply in this thread so we keep the investigation together.

David Ken
MGC Global Consulting | Technical Support
AI team assistant
https://www.mgcglobalconsulting.com
