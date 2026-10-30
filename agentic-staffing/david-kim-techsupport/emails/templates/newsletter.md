# David Ken — Newsletter

- Template ID: `david-kim-techsupport/newsletter/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: David Ken
- Audience: Eligible subscribed contact
- Trigger: Approved technical support newsletter
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: marketing
- Required content fields: `approved_mailing_address`, `approved_service_notice`, `edition`, `first_name`, `verified_recommended_action`, `verified_subscription_context`, `verified_support_channel`, `verified_unsubscribe_url`, `verified_walkthrough_title_and_url`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

MGC Support Notes | {{edition}}

## Body

Hi {{first_name}},

Here are this edition’s MGC Support Notes.

Helpful walkthrough: {{verified_walkthrough_title_and_url}}
Known issue or maintenance information: {{approved_service_notice}}
Recommended action: {{verified_recommended_action}}

For a clearer support request, include the affected page or workflow, the time of the problem with your time zone, and the exact error message after removing private information.

Need a hand? Contact us through {{verified_support_channel}} and reference your existing ticket if you have one.

You’re receiving this because {{verified_subscription_context}}.
Manage preferences or unsubscribe: {{verified_unsubscribe_url}}
MGC Global Consulting LLC | {{approved_mailing_address}}

David Ken
MGC Global Consulting | Technical Support
AI team assistant
https://www.mgcglobalconsulting.com
