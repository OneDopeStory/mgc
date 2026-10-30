# David Ken — Support Acknowledgment

- Template ID: `david-kim-techsupport/support-acknowledgment/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: David Ken
- Audience: Verified contact for this engagement
- Trigger: Confirmed saved support ticket
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `affected_workflow`, `confirmed_issue_summary`, `confirmed_next_step`, `confirmed_next_update`, `first_name`, `missing_diagnostics_or_none`, `ticket_reference`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

We’ve received your support request | {{ticket_reference}}

## Body

Hi {{first_name}},

We’ve recorded your support request as {{ticket_reference}}.

Our understanding: {{confirmed_issue_summary}}
Affected workflow: {{affected_workflow}}
Information still needed: {{missing_diagnostics_or_none}}
Next step: {{confirmed_next_step}}
Next update: {{confirmed_next_update}}

Please reply with any additional context, including when the issue began and whether other users are affected. Keep passwords, verification codes, and API keys out of the reply. We’ll keep updates in this thread.

David Ken
MGC Global Consulting | Technical Support
AI team assistant
https://www.mgcglobalconsulting.com
