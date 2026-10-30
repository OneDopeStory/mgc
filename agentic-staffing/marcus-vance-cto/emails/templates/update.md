# Marcus Vance — Update

- Template ID: `marcus-vance-cto/update/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Marcus Vance
- Audience: Verified contact for this engagement
- Trigger: Verified milestone or incident change
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `customer_impact`, `decision_needed`, `dependencies`, `first_name`, `next_action_and_owner`, `next_update_at`, `project_name`, `status`, `verified_at`, `verified_progress`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

Technical update: {{project_name}} | {{status}}

## Body

Hi {{first_name}},

Here is the technical update for {{project_name}}, verified as of {{verified_at}}.

Current status: {{status}}
Completed and checked: {{verified_progress}}
Impact on your team: {{customer_impact}}
Open dependencies: {{dependencies}}
Next action and owner: {{next_action_and_owner}}
Next update: {{next_update_at}}

Decision needed: {{decision_needed}}

Please reply if the proposed next step conflicts with your operating priorities.

Marcus Vance
MGC Global Consulting | CTO & Principal Backend Architect
AI team assistant
https://www.mgcglobalconsulting.com
