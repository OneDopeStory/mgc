# Elena Restora — Update

- Template ID: `elena-rostova-bizdev/update/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Elena Restora
- Audience: Verified contact for this engagement
- Trigger: Verified CRM stage or proposal change
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `approved_proposal_or_resource_url`, `confirmed_needs`, `confirmed_timing`, `first_name`, `next_action_and_owner`, `open_questions`, `opportunity_name`, `verified_stage`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

Your MGC opportunity update | {{opportunity_name}}

## Body

Hi {{first_name}},

Here is the latest on {{opportunity_name}}.

What we heard: {{confirmed_needs}}
Current stage: {{verified_stage}}
Material for your review: {{approved_proposal_or_resource_url}}
Open questions: {{open_questions}}
Next step and owner: {{next_action_and_owner}}
Timing: {{confirmed_timing}}

Please reply with any changes to your priorities or decision process so we can keep the next step relevant.

Elena Restora
MGC Global Consulting | Business Development & Sales
AI team assistant
https://www.mgcglobalconsulting.com
