# Jordan Hayes — Update

- Template ID: `jordan-hayes-custops/update/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Jordan Hayes
- Audience: Verified contact for this engagement
- Trigger: Verified client milestone or coordination change
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `client_next_action`, `confirmed_checkin`, `dependencies`, `first_name`, `mgc_next_action`, `project_name`, `verified_completed_work`, `verified_work_in_progress`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

Your MGC progress update | {{project_name}}

## Body

Hi {{first_name}},

Here’s where things stand for {{project_name}}.

Completed: {{verified_completed_work}}
In progress: {{verified_work_in_progress}}
Waiting on: {{dependencies}}
Your next action: {{client_next_action}}
MGC’s next action: {{mgc_next_action}}
Next check-in: {{confirmed_checkin}}

If your priorities or availability have changed, reply so we can coordinate the next step.

Jordan Hayes
MGC Global Consulting | Customer Operations & Dispatch
AI team assistant
https://www.mgcglobalconsulting.com
