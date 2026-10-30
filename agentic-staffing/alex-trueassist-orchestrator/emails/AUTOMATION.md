# Future cloud handoff — Alex and Hermes

**Specification only; no background process or integration is installed by this folder.** The owner wants automatic draft preparation and on-the-road updates after Hermes is set up in the cloud. This document is the implementation contract.

## Trigger routing

These are normalized internal event names to map from the actual CRM/provider, not existing webhook subscriptions.

| Event | Draft owner / template | Behavior |
|---|---|---|
| customer.onboarding_confirmed | Jordan / welcome | One primary welcome-board draft per confirmed engagement |
| lead.qualified | Elena / welcome | Prepare discovery follow-up from verified lead record |
| campaign.approved | Elena / crm-promotion | One draft per eligible recipient; check suppression first |
| newsletter.approved | Relevant staff / newsletter | Prepare email and channel variants for the approved audience |
| project.milestone_changed | Jordan / update | Customer-facing progress summary |
| technical.milestone_changed | Marcus / update | Verified technical progress; notify Mark if relevant |
| architecture.decision_needed | Marcus / architecture-decision | Prepare owner decision brief |
| support.ticket_created | David / support-acknowledgment | Acknowledge only a ticket that exists |
| support.ticket_changed | David / update | Verified investigation/resolution progress |
| invoice.issued | Julian / invoice-cover | Verify issued invoice before preparing cover note |
| invoice.status_changed | Julian / update | Recheck balance and payment status |
| policy.notice_approved | Relevant staff / terms-policy | Use approved document/version and specified affected audience |
| owner.update_requested | Alex / channel owner brief | Consolidate verified specialist status for Mark |

A portal signup or CRM lead is not automatically a paying/contracted customer. Define onboarding_confirmed from the approved business transition (for example, a signed engagement and required kickoff prerequisites), not from a page view or bare profile insert. Department welcome emails require their own stage event.

## Draft workflow

1. Receive an authenticated, validated event; record its provider ID, event time, engagement/contact ID, and business state. Read current source data rather than trusting event text alone.
2. Claim a durable idempotency record before drafting. Semantic key: `source:event_id:engagement_id:template_id:recipient_id`; add a unique business-transition key to catch different events for the same onboarding transition. Use a database uniqueness constraint/transaction when implemented; local files alone cannot guarantee concurrency safety.
3. Select the template via roles.json; verify sender authorization, recipient, source records, and required fields. Missing data creates a blocked work item and owner notice, not a guessed customer message.
4. Write the editable local draft and manifest atomically in the staff member’s drafts directory. In cloud execution use a private persistent volume or store, never an ephemeral working directory as the only copy. Store time in ISO 8601 UTC, with recipient-local time zones in email scheduling text.
5. Once Gmail is connected, create an **unsent Gmail draft** using the authorized mailbox. Persist the returned draft ID and account identity. Keep Gmail draft state separate from review status. If the result is uncertain after a timeout, reconcile against the mailbox before retrying; do not blindly create a duplicate. Edits update the same draft and reset approval.
6. Notify Mark through the configured Slack destination; optionally mirror to the configured Telegram chat and/or WhatsApp. The owner may choose Gmail for owner updates through Hermes. Use short channel briefs and a verified private record/review link. Do not invent a Gmail URL from a draft ID.
7. Customer sends require recorded approval of the exact content and recipients. Recheck recipient suppression, invoice/payment status, policy versions, and relevant timing immediately before sending. If anything material changes, return to review. Record provider result and timestamps.
8. Deliver owner-only operational notifications automatically once their destinations and channel policy are confirmed. This does not authorize automatic customer promotions. Treat approval/decision prompts as awaiting a decision; do not interpret silence or an unrelated reply as approval.

## Existing integration overlap

- `netlify/functions/trueassist.js` calls `recordLead` from `netlify/lib/leads.js`; that path can send a lead acknowledgment through Resend. Verify its current configuration before connecting another acknowledgment path.
- `netlify/functions/new-client-signup.js` handles profile inserts and creates a Notion lead; this is not proof that the person has completed paid onboarding.
- `netlify/functions/lead-intake.js` receives lead submissions. Do not attach an unconditional onboarding welcome to every lead submission.

Keep lead acknowledgment, confirmed-customer onboarding, departmental onboarding, and promotional campaigns distinct. Before activation decide which existing path owns each message and reconcile prior sends/drafts. Do not silently disable or change existing production behavior as part of adding these files.

## Channel rules and failure handling

For every relevant confirmed state change, send Mark a short status, impact, next step, owner, and decision-needed note. If multiple events report the same change, coalesce them. Group routine bursts into one digest; notify urgent confirmed blockers promptly. Quiet hours and cadence are configurable, not implied by this document.

Newsletter channel posts need an explicit target audience and approved copy. Internal owner notifications use a private destination. Do not reuse a public newsletter channel for private client updates.

Track Slack, Telegram, WhatsApp, and Gmail independently: `pending`, `delivered`, `failed`, or `not_configured`. A Slack failure must not create another Gmail draft or undo a successfully prepared draft. Retry only transient failed deliveries with bounded backoff; persist attempts and surface exhausted retries for operator review. Missing destinations remain `not_configured`; never fall back to an arbitrary channel. Store provider IDs and restricted error details, without credentials or full client bodies in general logs.

## Activation inputs still needed

Hermes cloud runtime and private durable storage; CRM event mapping and authenticated delivery; Gmail account/OAuth connection and authorized sender/reply-to identities; Mark’s verified owner email; private Slack destination; Telegram chat and bot connection; WhatsApp Business/Cloud API connection; separate newsletter destinations; owner notification cadence; approved policy documents; promotion audience/offer/unsubscribe setup. Store secrets in the cloud secret manager, not connections JSON.

Before calling automation active, test: a confirmed onboarding event creates one local draft and one Gmail draft; replay and concurrent duplicates create neither a second draft nor a send; missing fields block review; opt-outs suppress promotions; edit-after-approval resets approval; one channel failure leaves the draft intact; and an owner-only test notification reaches each configured destination. A live send to a test recipient must be explicitly requested for that activation test.
