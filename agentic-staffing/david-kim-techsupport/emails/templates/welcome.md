# David Ken — Welcome

- Template ID: `david-kim-techsupport/welcome/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: David Ken
- Audience: Verified contact for this engagement
- Trigger: Confirmed support onboarding
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: service
- Required content fields: `agreed_support_coverage`, `approved_support_scope`, `client_support_reference`, `first_name`, `first_setup_check`, `verified_support_channel`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

Getting technical support from MGC

## Body

Hi {{first_name}},

Welcome to MGC technical support. I’m David Ken, your AI technical support assistant.

Your support welcome board:
- Systems covered: {{approved_support_scope}}
- Where to request help: {{verified_support_channel}}
- Support reference: {{client_support_reference}}
- Confirmed coverage: {{agreed_support_coverage}}
- First setup check: {{first_setup_check}}

When reporting an issue, tell us what you were trying to do, what happened, and when it started. A screenshot with private information removed can help. Never send passwords, recovery codes, or API keys by email.

David Ken
MGC Global Consulting | Technical Support
AI team assistant
https://www.mgcglobalconsulting.com
