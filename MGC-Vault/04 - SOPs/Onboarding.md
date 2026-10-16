---
type: sop
title: Client Onboarding
version: 1.0
last_updated: 2026-04-10
owner: Mark
tags: [sop, onboarding]
---

# Client Onboarding SOP

## Purpose
Ensure every new client has a consistent, high-quality first 72 hours with MGC. Sets the tone for the entire engagement.

## Trigger
Stripe payment confirmed → Webhook fires → Client record created in Supabase + Notion

---

## Steps

### Step 1 — Within 1 Hour: Send Welcome Message
**Who:** Mark (or automated via Twilio WhatsApp)
**When:** Immediately after payment confirmed
**How:**
- WhatsApp receipt is sent automatically via payment webhook
- Follow up personally within 1 hour with a voice note or personalized message
- Confirm their portal access at mgcglobalconsulting.com/dashboard

### Step 2 — Within 24 Hours: Discovery Prep
**Who:** Mark
**When:** Day 1
**How:**
- Create client note in Obsidian: [[02 - Clients/Client Name]]
- Review their Business Profile questionnaire in admin portal
- Pull their Supabase profile data
- Prepare 3 targeted discovery questions based on their questionnaire

### Step 3 — Within 48 Hours: Kickoff Call
**Who:** Mark + Client
**When:** Day 2
**How:**
- Book via dashboard scheduler or Calendly
- Use discovery questions from Step 2
- Record call (with permission)
- Log notes in [[05 - Meetings/YYYY-MM-DD Client Name]]

### Step 4 — Within 72 Hours: Project Setup
**Who:** Mark
**When:** Day 3
**How:**
- Create project record in Supabase (visible on client dashboard)
- Create Notion project page linked to client record
- Share initial project roadmap with client via dashboard deliverables
- Set first milestone + due date

---

## Checklist
- [ ] Payment confirmed in Stripe
- [ ] Client appears in Supabase `mgc_client_profiles`
- [ ] Notion client record created/updated to Active
- [ ] Welcome message sent (WhatsApp auto + personal follow-up)
- [ ] Obsidian client note created
- [ ] Questionnaire reviewed
- [ ] Kickoff call scheduled
- [ ] Project created in Supabase dashboard
- [ ] First milestone set

---

## Tools
- Stripe (payment trigger)
- Supabase (client data)
- Notion (CRM record)
- Obsidian (strategy notes)
- mgcglobalconsulting.com/admin (admin portal)
- WhatsApp / Twilio (automated receipt)

---

## Common Issues
> [!warning]
> If the Notion webhook fails, manually update the client record to "Active" in Notion within 1 hour.

> [!warning]
> If client doesn't receive portal login email, check Supabase Auth logs and resend confirmation.

