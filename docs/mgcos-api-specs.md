# MGCOS Elite — API Integration Specification

**Product:** MGC Operating System (MGCOS)
**Tier:** Elite
**Version:** 1.0.0
**Status:** Internal Reference — No real credentials or keys

---

## Table of Contents

1. [Webhook Event Catalog](#1-webhook-event-catalog)
2. [Inbound API Endpoint Reference](#2-inbound-api-endpoint-reference)
3. [Integration Matrix](#3-integration-matrix)

---

## 1. Webhook Event Catalog

MGCOS emits signed webhook payloads to registered listener URLs whenever system events occur. All payloads are delivered via HTTP POST with the header `X-MGCOS-Signature: sha256=<hmac>` for verification.

**Base envelope** (wraps every event payload):

```json
{
  "event_id": "evt_01HXYZABCDEFGH",
  "event": "<event.name>",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T14:30:00Z",
  "api_version": "2026-10",
  "data": { ... }
}
```

---

### 1.1 `contact.created`

| Field | Value |
|---|---|
| **Trigger** | A new contact record is created in MGCOS — via form submission, manual entry, or inbound sync from a connected CRM. |
| **Recommended consumer action** | Add the contact to your external CRM or marketing list; trigger a welcome sequence. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000001",
  "event": "contact.created",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T09:15:22Z",
  "api_version": "2026-10",
  "data": {
    "contact_id": "con_7a3f9b2c",
    "first_name": "Jordan",
    "last_name": "Wallace",
    "email": "jordan.wallace@example.com",
    "phone": "+14045550182",
    "source": "landing_page",
    "tags": ["prospect", "enterprise"],
    "created_at": "2026-10-23T09:15:22Z"
  }
}
```

---

### 1.2 `contact.updated`

| Field | Value |
|---|---|
| **Trigger** | One or more fields on an existing contact record change (name, email, phone, stage, tags). |
| **Recommended consumer action** | Sync the delta to your external CRM; re-segment mailing lists if tags changed. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000002",
  "event": "contact.updated",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T10:04:11Z",
  "api_version": "2026-10",
  "data": {
    "contact_id": "con_7a3f9b2c",
    "changed_fields": ["email", "tags"],
    "previous": {
      "email": "jordan.w@example.com",
      "tags": ["prospect"]
    },
    "current": {
      "email": "jordan.wallace@example.com",
      "tags": ["prospect", "enterprise"]
    },
    "updated_at": "2026-10-23T10:04:11Z"
  }
}
```

---

### 1.3 `booking.confirmed`

| Field | Value |
|---|---|
| **Trigger** | A booking moves to `confirmed` status — either by explicit client acceptance or automated payment capture. |
| **Recommended consumer action** | Create a calendar event; send a confirmation email; provision any required service resources. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000003",
  "event": "booking.confirmed",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T11:20:00Z",
  "api_version": "2026-10",
  "data": {
    "booking_id": "bkg_cc8812de",
    "contact_id": "con_7a3f9b2c",
    "service": "Elite Strategy Intensive",
    "starts_at": "2026-11-10T13:00:00Z",
    "ends_at": "2026-11-10T15:00:00Z",
    "location": "virtual",
    "meeting_url": "https://meet.mgcos.io/r/abc123",
    "confirmed_by": "client",
    "confirmed_at": "2026-10-23T11:20:00Z"
  }
}
```

---

### 1.4 `booking.cancelled`

| Field | Value |
|---|---|
| **Trigger** | A previously confirmed booking is cancelled by either the client or an MGCOS team member. |
| **Recommended consumer action** | Remove the calendar event; trigger a re-engagement workflow; log the cancellation reason for reporting. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000004",
  "event": "booking.cancelled",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T12:05:44Z",
  "api_version": "2026-10",
  "data": {
    "booking_id": "bkg_cc8812de",
    "contact_id": "con_7a3f9b2c",
    "cancelled_by": "client",
    "reason": "schedule_conflict",
    "refund_issued": true,
    "refund_amount_cents": 75000,
    "cancelled_at": "2026-10-23T12:05:44Z"
  }
}
```

---

### 1.5 `booking.rescheduled`

| Field | Value |
|---|---|
| **Trigger** | A confirmed booking's date/time changes. Both old and new slots are included in the payload. |
| **Recommended consumer action** | Update calendar entries; send a reschedule confirmation to all attendees. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000005",
  "event": "booking.rescheduled",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T13:00:00Z",
  "api_version": "2026-10",
  "data": {
    "booking_id": "bkg_cc8812de",
    "contact_id": "con_7a3f9b2c",
    "previous_slot": {
      "starts_at": "2026-11-10T13:00:00Z",
      "ends_at": "2026-11-10T15:00:00Z"
    },
    "new_slot": {
      "starts_at": "2026-11-17T14:00:00Z",
      "ends_at": "2026-11-17T16:00:00Z"
    },
    "rescheduled_by": "team_member",
    "rescheduled_at": "2026-10-23T13:00:00Z"
  }
}
```

---

### 1.6 `payment.received`

| Field | Value |
|---|---|
| **Trigger** | A payment is successfully captured — invoice payment, retainer, or one-time charge. |
| **Recommended consumer action** | Update revenue records in your accounting system (e.g., QuickBooks); mark the invoice paid; send a receipt. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000006",
  "event": "payment.received",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T14:30:00Z",
  "api_version": "2026-10",
  "data": {
    "payment_id": "pay_9f1c3a77",
    "invoice_id": "inv_a4b5c6d7",
    "contact_id": "con_7a3f9b2c",
    "amount_cents": 250000,
    "currency": "USD",
    "method": "card",
    "last4": "4242",
    "stripe_charge_id": "ch_FICTIONAL_3MbLBWge5eF0",
    "paid_at": "2026-10-23T14:30:00Z"
  }
}
```

---

### 1.7 `payment.failed`

| Field | Value |
|---|---|
| **Trigger** | A payment attempt is declined or encounters a processing error. |
| **Recommended consumer action** | Alert the account owner via Slack or email; pause dependent automation steps; initiate a retry workflow. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000007",
  "event": "payment.failed",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T14:35:00Z",
  "api_version": "2026-10",
  "data": {
    "payment_id": "pay_fail_3c99x",
    "invoice_id": "inv_a4b5c6d7",
    "contact_id": "con_7a3f9b2c",
    "amount_cents": 250000,
    "currency": "USD",
    "failure_code": "insufficient_funds",
    "failure_message": "Your card has insufficient funds.",
    "retry_count": 1,
    "next_retry_at": "2026-10-24T14:35:00Z",
    "failed_at": "2026-10-23T14:35:00Z"
  }
}
```

---

### 1.8 `payment.refunded`

| Field | Value |
|---|---|
| **Trigger** | A full or partial refund is issued against a previously captured payment. |
| **Recommended consumer action** | Create a credit memo in your accounting system; update the client's balance in the CRM; notify the client. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000008",
  "event": "payment.refunded",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-24T09:00:00Z",
  "api_version": "2026-10",
  "data": {
    "refund_id": "ref_bb22441f",
    "payment_id": "pay_9f1c3a77",
    "contact_id": "con_7a3f9b2c",
    "refund_amount_cents": 125000,
    "total_paid_cents": 250000,
    "is_full_refund": false,
    "reason": "service_adjustment",
    "issued_by": "team_member",
    "refunded_at": "2026-10-24T09:00:00Z"
  }
}
```

---

### 1.9 `invoice.generated`

| Field | Value |
|---|---|
| **Trigger** | MGCOS automatically generates or a team member manually creates a new invoice. |
| **Recommended consumer action** | Push the invoice to QuickBooks or your accounting platform; notify the client; set a payment-due reminder. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000009",
  "event": "invoice.generated",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T08:00:00Z",
  "api_version": "2026-10",
  "data": {
    "invoice_id": "inv_a4b5c6d7",
    "contact_id": "con_7a3f9b2c",
    "line_items": [
      { "description": "Elite Strategy Intensive — Q4 2026", "amount_cents": 250000 }
    ],
    "subtotal_cents": 250000,
    "tax_cents": 0,
    "total_cents": 250000,
    "currency": "USD",
    "due_date": "2026-11-07",
    "invoice_url": "https://mgcos.io/invoices/inv_a4b5c6d7",
    "generated_at": "2026-10-23T08:00:00Z"
  }
}
```

---

### 1.10 `review.posted`

| Field | Value |
|---|---|
| **Trigger** | A client submits a review through the MGCOS review portal or a connected review platform. |
| **Recommended consumer action** | Publish the review to your public testimonials page; flag low scores for immediate follow-up; thank 5-star reviewers automatically. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000010",
  "event": "review.posted",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T16:45:00Z",
  "api_version": "2026-10",
  "data": {
    "review_id": "rev_d3ef5812",
    "contact_id": "con_7a3f9b2c",
    "rating": 5,
    "title": "Exceptional ROI in 90 days",
    "body": "Working with MGC transformed our outreach pipeline...",
    "source": "mgcos_portal",
    "is_public": true,
    "posted_at": "2026-10-23T16:45:00Z"
  }
}
```

---

### 1.11 `review.flagged`

| Field | Value |
|---|---|
| **Trigger** | A review is automatically or manually flagged for policy violations, suspected spam, or a rating below the account's configured threshold. |
| **Recommended consumer action** | Route the review to a moderation queue; suppress from public display until resolved; notify the account owner. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000011",
  "event": "review.flagged",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T17:10:00Z",
  "api_version": "2026-10",
  "data": {
    "review_id": "rev_f8aa2299",
    "contact_id": "con_b1c2d3e4",
    "rating": 1,
    "flag_reason": "below_threshold",
    "threshold_rating": 3,
    "flagged_by": "system",
    "status": "pending_review",
    "flagged_at": "2026-10-23T17:10:00Z"
  }
}
```

---

### 1.12 `agent.escalated`

| Field | Value |
|---|---|
| **Trigger** | The MGCOS AI agent cannot resolve a conversation and hands off to a human team member. |
| **Recommended consumer action** | Open a support ticket; notify the assigned team member via Slack; pause any active drip sequences for that contact. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000012",
  "event": "agent.escalated",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T18:00:00Z",
  "api_version": "2026-10",
  "data": {
    "conversation_id": "conv_77cc3312",
    "contact_id": "con_7a3f9b2c",
    "agent_id": "agent_mgcos_primary",
    "escalation_reason": "sentiment_negative",
    "confidence_score": 0.32,
    "assigned_to": {
      "team_member_id": "usr_mgc_001",
      "name": "Alex Rivera",
      "email": "alex@mgcglobal.io"
    },
    "escalated_at": "2026-10-23T18:00:00Z"
  }
}
```

---

### 1.13 `pipeline.stage_changed`

| Field | Value |
|---|---|
| **Trigger** | A contact or deal moves from one pipeline stage to another — manually or via automation rule. |
| **Recommended consumer action** | Update the corresponding deal in HubSpot or Salesforce; trigger stage-specific email sequences; log the move for pipeline velocity reporting. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000013",
  "event": "pipeline.stage_changed",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T19:30:00Z",
  "api_version": "2026-10",
  "data": {
    "pipeline_id": "pipe_enterprise_q4",
    "contact_id": "con_7a3f9b2c",
    "deal_id": "deal_88fa1234",
    "previous_stage": {
      "id": "stage_003",
      "name": "Proposal Sent"
    },
    "current_stage": {
      "id": "stage_004",
      "name": "Contract Negotiation"
    },
    "moved_by": "automation",
    "moved_at": "2026-10-23T19:30:00Z"
  }
}
```

---

### 1.14 `workflow.triggered`

| Field | Value |
|---|---|
| **Trigger** | An automation workflow is initiated — by a contact action, a scheduled rule, or a webhook from an external system. |
| **Recommended consumer action** | Log the trigger in your analytics platform; use the workflow context to coordinate parallel steps in Make or Zapier. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000014",
  "event": "workflow.triggered",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T20:00:00Z",
  "api_version": "2026-10",
  "data": {
    "workflow_id": "wf_onboarding_elite",
    "workflow_name": "Elite Client Onboarding",
    "trigger_type": "contact_tag_added",
    "trigger_metadata": {
      "tag": "elite",
      "contact_id": "con_7a3f9b2c"
    },
    "steps_total": 7,
    "steps_completed": 0,
    "triggered_at": "2026-10-23T20:00:00Z"
  }
}
```

---

### 1.15 `campaign.completed`

| Field | Value |
|---|---|
| **Trigger** | A marketing or outreach campaign finishes sending all scheduled messages or reaches its end date. |
| **Recommended consumer action** | Pull final campaign metrics into your reporting dashboard; export the engagement list to your CRM for follow-up segmentation. |

**Payload example:**

```json
{
  "event_id": "evt_01HXCRT0000015",
  "event": "campaign.completed",
  "account_id": "acct_mgc_4872",
  "timestamp": "2026-10-23T23:59:00Z",
  "api_version": "2026-10",
  "data": {
    "campaign_id": "cmp_q4_elite_nurture",
    "campaign_name": "Q4 Elite Nurture Sequence",
    "type": "email_sequence",
    "contacts_enrolled": 142,
    "messages_sent": 710,
    "open_rate": 0.61,
    "click_rate": 0.24,
    "unsubscribes": 3,
    "completed_at": "2026-10-23T23:59:00Z"
  }
}
```

---

## 2. Inbound API Endpoint Reference

**Base URL:** `https://api.mgcos.io/v1`

All requests require the header:
```
Authorization: Bearer <your_api_key>
Content-Type: application/json
```

**Standard error shape:**

```json
{
  "error": {
    "code": "validation_error",
    "message": "The field 'email' is required.",
    "param": "email",
    "status": 422
  }
}
```

**Common error codes:**

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `bad_request` | Malformed request body |
| 401 | `unauthorized` | Missing or invalid API key |
| 403 | `forbidden` | Authenticated but lacks permission |
| 404 | `not_found` | Resource does not exist |
| 409 | `conflict` | Duplicate resource |
| 422 | `validation_error` | Field-level validation failure |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Server-side error |

---

### 2.1 `POST /contacts`

**Description:** Creates a new contact in the MGCOS CRM. Returns the full contact object on success. Duplicate email addresses return a `409 conflict`.

**Request body:**

```json
{
  "first_name": "Jordan",
  "last_name": "Wallace",
  "email": "jordan.wallace@example.com",
  "phone": "+14045550182",
  "company": "Wallace Ventures LLC",
  "source": "website_form",
  "tags": ["prospect", "enterprise"],
  "custom_fields": {
    "industry": "Technology",
    "annual_revenue": "2M-5M"
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `first_name` | string | Yes | Max 100 chars |
| `last_name` | string | Yes | Max 100 chars |
| `email` | string | Yes | Must be valid email; unique per account |
| `phone` | string | No | E.164 format recommended |
| `company` | string | No | |
| `source` | string | No | Enum: `website_form`, `referral`, `import`, `manual`, `api` |
| `tags` | array of strings | No | |
| `custom_fields` | object | No | Keys must match account's custom field schema |

**Success response — `201 Created`:**

```json
{
  "contact_id": "con_7a3f9b2c",
  "first_name": "Jordan",
  "last_name": "Wallace",
  "email": "jordan.wallace@example.com",
  "phone": "+14045550182",
  "company": "Wallace Ventures LLC",
  "source": "website_form",
  "tags": ["prospect", "enterprise"],
  "pipeline_stage": null,
  "created_at": "2026-10-23T09:15:22Z",
  "updated_at": "2026-10-23T09:15:22Z"
}
```

**Error codes:** `400`, `401`, `409`, `422`

---

### 2.2 `GET /contacts/{contact_id}`

**Description:** Retrieves a single contact record by its unique ID. Includes all CRM fields, tags, and pipeline stage.

**Path parameter:** `contact_id` — the contact's unique identifier (e.g., `con_7a3f9b2c`).

**Request body:** None.

**Success response — `200 OK`:**

```json
{
  "contact_id": "con_7a3f9b2c",
  "first_name": "Jordan",
  "last_name": "Wallace",
  "email": "jordan.wallace@example.com",
  "phone": "+14045550182",
  "company": "Wallace Ventures LLC",
  "source": "website_form",
  "tags": ["prospect", "enterprise"],
  "pipeline_stage": {
    "id": "stage_004",
    "name": "Contract Negotiation"
  },
  "lifetime_value_cents": 250000,
  "last_activity_at": "2026-10-23T19:30:00Z",
  "created_at": "2026-10-23T09:15:22Z",
  "updated_at": "2026-10-23T19:30:00Z"
}
```

**Error codes:** `401`, `403`, `404`

---

### 2.3 `POST /bookings`

**Description:** Creates a new booking for a contact. Checks team availability and returns a conflict error if the requested slot is unavailable.

**Request body:**

```json
{
  "contact_id": "con_7a3f9b2c",
  "service_id": "svc_elite_intensive",
  "starts_at": "2026-11-10T13:00:00Z",
  "ends_at": "2026-11-10T15:00:00Z",
  "location": "virtual",
  "assigned_to": "usr_mgc_001",
  "notes": "Client prefers Google Meet. Bring Q3 proposal deck.",
  "send_confirmation": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `contact_id` | string | Yes | Must reference an existing contact |
| `service_id` | string | Yes | Must reference an active service |
| `starts_at` | ISO 8601 | Yes | Future datetime |
| `ends_at` | ISO 8601 | Yes | Must be after `starts_at` |
| `location` | string | No | Enum: `virtual`, `in_person`, `phone` |
| `assigned_to` | string | No | Team member user ID |
| `notes` | string | No | Internal notes; not visible to client |
| `send_confirmation` | boolean | No | Default `true` — sends email to contact |

**Success response — `201 Created`:**

```json
{
  "booking_id": "bkg_cc8812de",
  "contact_id": "con_7a3f9b2c",
  "service": "Elite Strategy Intensive",
  "starts_at": "2026-11-10T13:00:00Z",
  "ends_at": "2026-11-10T15:00:00Z",
  "location": "virtual",
  "meeting_url": "https://meet.mgcos.io/r/abc123",
  "status": "confirmed",
  "assigned_to": "usr_mgc_001",
  "created_at": "2026-10-23T09:20:00Z"
}
```

**Error codes:** `400`, `401`, `404`, `409` (slot unavailable), `422`

---

### 2.4 `GET /pipeline`

**Description:** Returns the full pipeline configuration for the account — all stages, their order, and aggregate deal counts and values.

**Query parameters:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `pipeline_id` | string | No | Filter to a specific pipeline; returns all pipelines if omitted |
| `include_contacts` | boolean | No | Default `false`; set `true` to embed contact IDs per stage |

**Request body:** None.

**Success response — `200 OK`:**

```json
{
  "pipelines": [
    {
      "pipeline_id": "pipe_enterprise_q4",
      "name": "Enterprise Q4",
      "stages": [
        {
          "id": "stage_001",
          "name": "New Lead",
          "order": 1,
          "contact_count": 38,
          "total_value_cents": 9500000
        },
        {
          "id": "stage_002",
          "name": "Discovery Call",
          "order": 2,
          "contact_count": 21,
          "total_value_cents": 5250000
        },
        {
          "id": "stage_003",
          "name": "Proposal Sent",
          "order": 3,
          "contact_count": 14,
          "total_value_cents": 3500000
        },
        {
          "id": "stage_004",
          "name": "Contract Negotiation",
          "order": 4,
          "contact_count": 7,
          "total_value_cents": 1750000
        },
        {
          "id": "stage_005",
          "name": "Closed Won",
          "order": 5,
          "contact_count": 5,
          "total_value_cents": 1250000
        }
      ]
    }
  ]
}
```

**Error codes:** `401`, `404`

---

### 2.5 `PATCH /bookings/{booking_id}`

**Description:** Partially updates an existing booking. Only the fields present in the request body are modified. Returns the full updated booking object.

**Path parameter:** `booking_id`

**Request body (all fields optional):**

```json
{
  "starts_at": "2026-11-17T14:00:00Z",
  "ends_at": "2026-11-17T16:00:00Z",
  "location": "in_person",
  "notes": "Moved to in-person at client HQ, Atlanta GA.",
  "status": "confirmed"
}
```

| Field | Type | Notes |
|---|---|---|
| `starts_at` | ISO 8601 | Availability check is re-run |
| `ends_at` | ISO 8601 | |
| `location` | string | `virtual`, `in_person`, `phone` |
| `status` | string | `confirmed`, `cancelled`, `no_show` |
| `notes` | string | Replaces previous notes |
| `assigned_to` | string | Team member user ID |

**Success response — `200 OK`:**

```json
{
  "booking_id": "bkg_cc8812de",
  "contact_id": "con_7a3f9b2c",
  "service": "Elite Strategy Intensive",
  "starts_at": "2026-11-17T14:00:00Z",
  "ends_at": "2026-11-17T16:00:00Z",
  "location": "in_person",
  "status": "confirmed",
  "notes": "Moved to in-person at client HQ, Atlanta GA.",
  "updated_at": "2026-10-23T13:00:00Z"
}
```

**Error codes:** `400`, `401`, `404`, `409` (new slot unavailable), `422`

---

### 2.6 `POST /payments`

**Description:** Initiates a payment charge against a contact's saved payment method for a specific invoice. Requires Elite tier payment processing to be enabled and a connected Stripe account.

> **Elite tier only.** This endpoint is unavailable on Starter and Growth plans.

**Request body:**

```json
{
  "invoice_id": "inv_a4b5c6d7",
  "contact_id": "con_7a3f9b2c",
  "amount_cents": 250000,
  "currency": "USD",
  "payment_method_id": "pm_FICTIONAL_3MbLBWge5eF0",
  "description": "Elite Strategy Intensive — Q4 2026",
  "idempotency_key": "idem_2026102309200001"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `invoice_id` | string | Yes | Must reference an open invoice |
| `contact_id` | string | Yes | Must match invoice's contact |
| `amount_cents` | integer | Yes | Must equal invoice balance due |
| `currency` | string | Yes | ISO 4217; currently only `USD` supported |
| `payment_method_id` | string | Yes | Stripe PaymentMethod ID |
| `description` | string | No | Appears on card statement |
| `idempotency_key` | string | Yes | Unique per request; prevents double-charges |

**Success response — `200 OK`:**

```json
{
  "payment_id": "pay_9f1c3a77",
  "invoice_id": "inv_a4b5c6d7",
  "status": "succeeded",
  "amount_cents": 250000,
  "currency": "USD",
  "receipt_url": "https://mgcos.io/receipts/pay_9f1c3a77",
  "paid_at": "2026-10-23T14:30:00Z"
}
```

**Error codes:** `400`, `401`, `403` (non-Elite tier), `402` (card declined), `404`, `409` (already paid), `422`

---

### 2.7 `GET /analytics/overview`

**Description:** Returns a high-level analytics summary for the account over a specified date range, including revenue, bookings, pipeline velocity, and top-performing campaigns.

**Query parameters:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `start_date` | ISO 8601 date | Yes | `YYYY-MM-DD` |
| `end_date` | ISO 8601 date | Yes | `YYYY-MM-DD`; max range 365 days |
| `compare_previous` | boolean | No | Default `false`; if `true`, includes prior-period delta |

**Request body:** None.

**Success response — `200 OK`:**

```json
{
  "period": {
    "start_date": "2026-10-01",
    "end_date": "2026-10-23"
  },
  "revenue": {
    "total_cents": 1875000,
    "delta_pct": 12.4
  },
  "bookings": {
    "confirmed": 24,
    "cancelled": 3,
    "no_show": 1,
    "delta_pct": 8.0
  },
  "new_contacts": 87,
  "pipeline": {
    "deals_won": 5,
    "deals_lost": 2,
    "avg_days_to_close": 18.3
  },
  "top_campaigns": [
    {
      "campaign_id": "cmp_q4_elite_nurture",
      "name": "Q4 Elite Nurture Sequence",
      "open_rate": 0.61,
      "revenue_attributed_cents": 500000
    }
  ]
}
```

**Error codes:** `400`, `401`, `422`

---

### 2.8 `POST /workflows`

**Description:** Manually triggers an automation workflow for a specific contact. Useful for enrolling a contact mid-sequence or forcing a workflow re-run.

**Request body:**

```json
{
  "workflow_id": "wf_onboarding_elite",
  "contact_id": "con_7a3f9b2c",
  "skip_to_step": null,
  "metadata": {
    "triggered_by": "api",
    "note": "Manual enrollment after in-person event"
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `workflow_id` | string | Yes | Must reference an active workflow |
| `contact_id` | string | Yes | |
| `skip_to_step` | integer | No | 1-indexed step number; default is step 1 |
| `metadata` | object | No | Arbitrary key-value pairs logged with the run |

**Success response — `202 Accepted`:**

```json
{
  "workflow_run_id": "wfr_cc4499aa",
  "workflow_id": "wf_onboarding_elite",
  "contact_id": "con_7a3f9b2c",
  "status": "running",
  "current_step": 1,
  "steps_total": 7,
  "started_at": "2026-10-23T20:00:00Z"
}
```

**Error codes:** `400`, `401`, `404`, `409` (contact already enrolled), `422`

---

### 2.9 `GET /conversations/{conversation_id}`

**Description:** Retrieves the full message history and metadata for a single AI agent or human conversation thread. Messages are returned in chronological order.

**Path parameter:** `conversation_id`

**Query parameters:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `limit` | integer | No | Default 50; max 200 |
| `before` | string | No | Message ID cursor for pagination |

**Request body:** None.

**Success response — `200 OK`:**

```json
{
  "conversation_id": "conv_77cc3312",
  "contact_id": "con_7a3f9b2c",
  "channel": "webchat",
  "status": "escalated",
  "assigned_to": "usr_mgc_001",
  "messages": [
    {
      "message_id": "msg_001",
      "role": "contact",
      "content": "Hi, I need help with my retainer contract.",
      "sent_at": "2026-10-23T17:55:00Z"
    },
    {
      "message_id": "msg_002",
      "role": "agent",
      "content": "Hi Jordan! I'd be happy to help. Could you share the contract reference number?",
      "sent_at": "2026-10-23T17:55:08Z"
    },
    {
      "message_id": "msg_003",
      "role": "contact",
      "content": "I want a refund. This is unacceptable.",
      "sentiment": "negative",
      "sent_at": "2026-10-23T17:59:44Z"
    }
  ],
  "total_messages": 3,
  "escalated_at": "2026-10-23T18:00:00Z"
}
```

**Error codes:** `401`, `403`, `404`

---

### 2.10 `POST /campaigns`

**Description:** Creates and optionally launches a new marketing or outreach campaign. Campaigns must be in `draft` status to launch; set `launch: true` to immediately begin sending.

> **Elite tier only.** Multi-channel campaign creation (email + SMS + social) is restricted to Elite accounts.

**Request body:**

```json
{
  "name": "Q4 Elite Nurture Sequence",
  "type": "email_sequence",
  "audience": {
    "type": "segment",
    "segment_id": "seg_enterprise_prospects"
  },
  "steps": [
    {
      "day": 0,
      "channel": "email",
      "template_id": "tpl_elite_welcome",
      "subject": "Welcome to the MGC Elite Experience"
    },
    {
      "day": 3,
      "channel": "email",
      "template_id": "tpl_elite_case_study",
      "subject": "How MGC helped a firm like yours add $2M in 6 months"
    }
  ],
  "start_date": "2026-11-01",
  "launch": false
}
```

**Success response — `201 Created`:**

```json
{
  "campaign_id": "cmp_q4_elite_nurture",
  "name": "Q4 Elite Nurture Sequence",
  "type": "email_sequence",
  "status": "draft",
  "audience_size": 142,
  "steps_count": 2,
  "start_date": "2026-11-01",
  "created_at": "2026-10-23T08:00:00Z"
}
```

**Error codes:** `400`, `401`, `403` (non-Elite tier for multi-channel), `404`, `422`

---

## 3. Integration Matrix

The table below maps 12 common third-party tools to their MGCOS integration profile. **Elite Only** integrations are not available on Starter or Growth plans.

> **Connection types:**
> - **Webhook** — MGCOS pushes events to an endpoint you register
> - **OAuth 2.0** — Authorized via the user's OAuth flow in MGCOS Settings
> - **API Key** — Authenticated via a static API key stored in MGCOS Settings
> - **Native** — Built-in connector maintained by the MGCOS integration team

> **Sync directions:**
> - **Inbound** — Data flows into MGCOS
> - **Outbound** — Data flows out of MGCOS
> - **Bidirectional** — Two-way sync

| # | Tool | Connection Type | Sync Direction | Elite Only | Notes |
|---|---|---|---|---|---|
| 1 | **Stripe** | OAuth 2.0 + Webhook | Bidirectional | No | Connect your Stripe account to enable payment capture, refunds, and invoice sync. MGCOS subscribes to Stripe's `charge.succeeded`, `charge.failed`, and `invoice.payment_succeeded` webhooks. Elite accounts unlock subscription billing and automatic retainer renewal. |
| 2 | **Zapier** | Webhook + API Key | Bidirectional | No | Use Zapier to connect MGCOS to 5,000+ apps. MGCOS is a Zapier trigger (fires on any webhook event) and a Zapier action (accepts calls to the MGCOS inbound API). No-code; ideal for teams without developers. |
| 3 | **Make (formerly Integromat)** | Webhook + API Key | Bidirectional | No | MGCOS native Make module available in the Make marketplace. Supports multi-step scenarios with MGCOS as both trigger and action node. Recommended over Zapier for complex multi-branch automation logic. |
| 4 | **HubSpot** | OAuth 2.0 | Bidirectional | No | Two-way sync of contacts, deals, and activity timelines. MGCOS pipeline stages map to HubSpot deal stages. Contact updates flow both directions; MGCOS is the system of record for bookings; HubSpot is the system of record for marketing engagement. |
| 5 | **Salesforce** | OAuth 2.0 | Bidirectional | **Yes** | Salesforce integration is Elite-only. Syncs MGCOS contacts to Salesforce leads/contacts, bookings to Salesforce events, and pipeline stage changes to Salesforce opportunity stages. Requires Salesforce API access (Professional edition or above). |
| 6 | **Slack** | OAuth 2.0 | Outbound | No | MGCOS posts real-time notifications to Slack channels you designate. Configurable triggers: new booking, payment received, agent escalation, review posted, pipeline stage change. Supports direct messages to assigned team members for escalations. |
| 7 | **Twilio** | API Key | Outbound | No | MGCOS uses your Twilio credentials to send SMS notifications and reminders. Used for: booking confirmations, payment receipts, and workflow SMS steps. Elite accounts unlock two-way SMS conversations managed through the MGCOS AI agent. |
| 8 | **OpenAI** | API Key | Inbound | **Yes** | Elite-only integration that allows you to supply your own OpenAI API key to power the MGCOS AI agent with your chosen GPT model. Enables custom system prompts, fine-tuned behavior, and GPT-4o for high-value client conversations. Usage is billed against your own OpenAI account. |
| 9 | **Notion** | OAuth 2.0 | Outbound | No | Exports MGCOS CRM data, meeting notes, and pipeline summaries to Notion databases you designate. Useful for building client-facing project workspaces that stay in sync with MGCOS activity. Read-back from Notion into MGCOS is not currently supported. |
| 10 | **Google Calendar** | OAuth 2.0 | Bidirectional | No | Syncs MGCOS bookings to your team's Google Calendars. New bookings create Calendar events; Calendar event cancellations reflect back in MGCOS booking status. Each team member authorizes their own calendar. Availability blocking reads from Google Calendar when checking booking slots. |
| 11 | **QuickBooks Online** | OAuth 2.0 | Outbound | **Yes** | Elite-only accounting integration. Pushes MGCOS invoices to QuickBooks as invoices, and payment events as received payments. Contacts sync as QuickBooks customers. Refunds create QuickBooks credit memos. Does not pull data from QuickBooks into MGCOS. |
| 12 | **ActiveCampaign** | API Key | Bidirectional | No | Syncs contacts and tags between MGCOS and ActiveCampaign. MGCOS pipeline stage changes trigger ActiveCampaign automations; ActiveCampaign contact field updates sync back to MGCOS custom fields. Useful for teams already running complex email automations in ActiveCampaign who want MGCOS to serve as the CRM layer. |

---

*Document generated: 2026-10-23 — MGCOS Elite API Integration Specification v1.0.0*
*All payload values are fictional and for illustrative purposes only. No real credentials, keys, or client data are present in this document.*
