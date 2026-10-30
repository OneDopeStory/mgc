# Starter draft — Elena Restora — Crm Promotion

- Template ID: `elena-rostova-bizdev/crm-promotion/v1`
- Status: NEEDS_PERSONALIZATION — never send this template as-is.
- Owner: Elena Restora
- Audience: Eligible subscribed contact
- Trigger: Owner-approved CRM promotion for an eligible contact
- To: {{verified_recipient_email}}
- From: {{verified_sender_mailbox}} (authorized mailbox; do not invent an address)
- Reply-To: {{verified_reply_to}}
- Classification: marketing
- Required content fields: `approved_booking_or_offer_url`, `approved_call_to_action`, `approved_inclusions`, `approved_mailing_address`, `approved_offer`, `approved_price_and_conditions`, `company_name`, `first_name`, `priority_area`, `relevant_use_case`, `verified_personalized_opening`, `verified_subscription_context`, `verified_unsubscribe_url`
- Review: Mark Cartwright or an explicitly delegated reviewer; follow [Alex’s email instructions](../../../alex-trueassist-orchestrator/emails/AGENTS.md).

## Subject

A focused next step for {{company_name}}’s {{priority_area}}

## Body

Hi {{first_name}},

{{verified_personalized_opening}}

MGC Global Consulting helps teams turn AI strategy, automation, and CRM improvements into practical operating plans. For {{company_name}}, a useful starting point could be {{relevant_use_case}}.

Our current offer: {{approved_offer}}
What it includes: {{approved_inclusions}}
Pricing and conditions: {{approved_price_and_conditions}}
Next step: {{approved_call_to_action}}

If this is relevant, reply with your main challenge or use {{approved_booking_or_offer_url}}. We can use that context to assess the fit.

You’re receiving this because {{verified_subscription_context}}.
Manage preferences or unsubscribe: {{verified_unsubscribe_url}}
MGC Global Consulting LLC | {{approved_mailing_address}}

Elena Restora
MGC Global Consulting | Business Development & Sales
AI team assistant
https://www.mgcglobalconsulting.com
