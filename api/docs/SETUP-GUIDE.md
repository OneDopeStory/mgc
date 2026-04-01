# MGC GLOBAL CONSULTING — COMPLETE ZAPIER + CLAUDE AUTOMATION GUIDE
## www.mgcglobalconsulting.com | Mark G. Cartwright, CEO

---

## BEFORE YOU START — ONE-TIME SETUP

### Step 1: Get Your Claude API Key
1. Go to **https://console.anthropic.com**
2. Log in → **API Keys** → **Create Key**
3. Name it: `MGC-Zapier-Production`
4. Copy the key — you'll only see it once
5. Store it in a password manager

### Step 2: Add Key to Zapier as a Secret
1. In Zapier → **Settings** → **Secret Manager**
2. Add new secret: `CLAUDE_API_KEY` = [your key]
3. In every Zap's Code step, map `CLAUDE_KEY` → `{{secret:CLAUDE_API_KEY}}`

### Step 3: Create Your Slack Channels
Create these channels in your Slack workspace:
| Channel | Purpose |
|---|---|
| `#mgc-ai-hub` | All Claude requests (type `🤖 MGC-AI: your request`) |
| `#mgc-daily-briefing` | 8AM daily briefing auto-posts here |
| `#mgc-leads` | All new inbound leads |
| `#mgc-bookings` | Calendly booking alerts |
| `#mgc-clients` | Client onboarding + updates |
| `#mgc-finance` | Invoice + payment tracking |
| `#mgc-membership` | Membership signups |
| `#mgc-operations` | Operations updates |
| `#mgc-internal` | Weekly reports (Friday 4PM) |
| `#recycle4life-ops` | Recycle-4-Life client channel |

### Step 4: Create Google Sheet — "MGC CRM"
Columns needed:
`ID | Name | Email | Phone | Company | Service | Status | Stage | Contract Value | Last Contact | Days Since Contact | Notes | Assigned To | Invoice # | Invoice Status`

---

## ZAP DIRECTORY — 11 AUTOMATIONS

### ZAP #1 — Contact Form Lead Capture
**File:** `zap-01-contact-form-lead.js`
**Trigger:** New form submission (Typeform / Gravity Forms / WPForms)
**What it does:**
- Claude scores the lead 1-10
- Drafts personalized reply email
- Posts formatted lead card to #mgc-leads
- Creates Gmail draft for Mark to review

**Zapier Steps:**
```
1. TRIGGER: Typeform — New Entry
2. CODE: Paste zap-01 file → map inputData fields
3. SLACK: Post Message → Channel: #mgc-leads → Text: {{output.slackMessage}}
4. GMAIL: Create Draft → To: {{inputData.leadEmail}} → Body: {{output.emailDraft}}
```

---

### ZAP #2 — Calendly Booking Intelligence
**File:** `zap-02-calendly-booking.js`
**Trigger:** New Calendly booking
**What it does:**
- Claude generates pre-meeting brief for Mark
- Sends personalized confirmation to client
- Creates meeting agenda
- Posts booking alert to #mgc-bookings

**Zapier Steps:**
```
1. TRIGGER: Calendly — Invitee Created
2. CODE: Paste zap-02 file → map inputData fields
3. SLACK: Post → #mgc-bookings → Text: {{output.slackAlert}}
4. GMAIL: Send → To: {{output.clientEmail}} → Body: {{output.clientConfirmation}}
5. GMAIL: Create Draft → Subject: "PREP BRIEF - {{output.clientName}}" → Body: {{output.markBrief}}
```

---

### ZAP #3 — Daily Morning Briefing (8AM)
**File:** `zap-03-daily-briefing.js`
**Trigger:** Schedule → Every day → 8:00 AM EST
**What it does:**
- Claude generates full day briefing
- Top 3 priorities for the day
- Stats + follow-up alerts
- Auto-posts to #mgc-daily-briefing

**Zapier Steps:**
```
1. TRIGGER: Schedule — Daily 8:00 AM
2. GOOGLE SHEETS: Lookup rows (yesterday's new leads count) [optional]
3. CODE: Paste zap-03 file → map counts
4. SLACK: Post → #mgc-daily-briefing → Text: {{output.slackMessage}}
```

---

### ZAP #4 — Service-Specific Lead Router
**File:** `zap-04-service-lead-router.js`
**Trigger:** Same as Zap #1 (add as additional path)
**What it does:**
- Routes lead to correct service channel
- Generates service-specific follow-up content
- Scores urgency (HIGH/MEDIUM/LOW)
- Drafts tailored proposal email

**Zapier Steps:**
```
1. TRIGGER: Typeform — New Entry
2. CODE: Paste zap-04 file
3. PATHS: Route based on {{output.targetChannel}}
   - Path A: urgency = HIGH → Slack alert + Gmail immediate draft
   - Path B: urgency = MEDIUM → Slack post + 24hr follow-up
   - Path C: urgency = LOW → Slack post only
```

---

### ZAP #5 — Invoice Generator & Payment Tracker
**File:** `zap-05-invoice-payment-tracker.js`
**Trigger:** New/updated row in Google Sheets (Invoices tab)
**What it does:**
- Claude drafts invoice cover letter
- Tracks payment status (🟢🟡🔴)
- Generates overdue reminder if needed
- Posts to #mgc-finance

**Zapier Steps:**
```
1. TRIGGER: Google Sheets — New/Updated Row (Invoices tab)
2. CODE: Paste zap-05 file → map invoice fields
3. SLACK: Post → #mgc-finance → Text: {{output.slackFinanceCard}}
4. GMAIL: Create Draft → To: {{output.clientEmail}} → Body: {{output.coverLetter}}
5. FILTER: If isOverdue = true → Send {{output.paymentReminderEmail}}
```

---

### ZAP #6 — Client Onboarding Automation
**File:** `zap-06-client-onboarding.js`
**Trigger:** Google Sheets row updated — Status = "Active Client"
**What it does:**
- Claude generates complete welcome kit
- Onboarding checklist with timelines
- 10 tailored intake questions
- Success KPIs for the engagement

**Zapier Steps:**
```
1. TRIGGER: Google Sheets — Row Updated (Status = "Active Client")
2. CODE: Paste zap-06 file
3. SLACK: Post → #mgc-clients → Text: {{output.slackCard}}
4. GMAIL: Send → To: {{output.clientEmail}} → Body: {{output.welcomeEmail}}
5. GMAIL: Create Draft → Subject: "NDA Reminder" → Body: {{output.ndaReminder}}
```

---

### ZAP #7 — NDA & Contract Auto-Draft
**File:** `zap-07-nda-contract-draft.js`
**Trigger:** Google Sheets — Stage updated to "Proposal"
**What it does:**
- Claude drafts SOW tailored to service type
- NDA summary email in plain English
- Professional proposal email from Mark
- Risk flags for Mark's review

**Zapier Steps:**
```
1. TRIGGER: Google Sheets — Row Updated (Stage = "Proposal")
2. CODE: Paste zap-07 file
3. SLACK: Post → #mgc-clients → Text: {{output.slackCard}}
4. GMAIL: Create Draft → Subject: "Proposal — {{output.serviceType}}" → Body: {{output.proposalEmail}}
```

---

### ZAP #8 — Slack AI Hub Handler (ON-DEMAND)
**File:** `zap-08-slack-ai-hub-handler.js`
**Trigger:** New message in #mgc-ai-hub containing "🤖" or "MGC-AI:"
**What it does:**
- Processes ANY request posted to Slack
- Responds in thread with full output
- Use for emails, contracts, strategy, content — anything

**HOW TO USE:**
Post in #mgc-ai-hub:
```
🤖 MGC-AI: Draft a follow-up for Anthony Harris about the $7,802 invoice
🤖 MGC-AI: Create a LinkedIn post about our CRM optimization service
🤖 MGC-AI: What are the top 3 things I should prioritize today?
```

**Zapier Steps:**
```
1. TRIGGER: Slack — New Message in Channel (#mgc-ai-hub)
2. FILTER: Message contains "🤖" OR "MGC-AI:"
3. CODE: Paste zap-08 file → map slackMessage, senderName
4. SLACK: Reply in Thread → Channel: #mgc-ai-hub → Text: {{output.reply}}
```

---

### ZAP #9 — Weekly Performance Report (Friday 4PM)
**File:** `zap-09-weekly-report.js`
**Trigger:** Schedule → Every Friday → 4:00 PM EST
**What it does:**
- Full week executive scorecard
- Wins, gaps, and next week priorities
- Revenue analysis
- Strategic insight for the week ahead

**Zapier Steps:**
```
1. TRIGGER: Schedule — Weekly, Friday, 4:00 PM
2. GOOGLE SHEETS: Count rows added this week [optional]
3. CODE: Paste zap-09 file → map weekly metrics
4. SLACK: Post → #mgc-internal → Text: {{output.slackMessage}}
5. GMAIL: Send → To: mark@mgcglobalconsulting.com → Body: {{output.executiveSummary}}
```

---

### ZAP #10 — Membership Signup Handler
**File:** `zap-10-membership-signup.js`
**Trigger:** Stripe new customer / Memberpress new member / Sheets new row
**What it does:**
- Personalized welcome email from Mark
- First-week quick-start guide
- 30-day check-in email draft
- Celebration post in #mgc-membership

**Zapier Steps:**
```
1. TRIGGER: Stripe — New Customer (or membership platform)
2. CODE: Paste zap-10 file → map member fields
3. SLACK: Post → #mgc-membership → Text: {{output.slackAnnouncement}}
4. GMAIL: Send → To: {{output.memberEmail}} → Body: {{output.welcomeEmail}}
```

---

### ZAP #11 — Stale Lead Re-engagement
**File:** `zap-11-stale-lead-reengagement.js`
**Trigger:** Schedule → Daily 9AM → checks for leads not touched in 7+ days
**What it does:**
- Identifies and revives cold leads
- Value-first re-engagement email (not salesy)
- Recommends whether to purge or escalate
- Slack alert with recommended action

**Zapier Steps:**
```
1. TRIGGER: Schedule — Daily 9:00 AM
2. GOOGLE SHEETS: Get rows where last_contact_date < TODAY-7
3. LOOP: Looping by Zapier (if multiple stale leads)
4. CODE: Paste zap-11 file → map lead fields
5. SLACK: Post → #mgc-leads → Text: {{output.slackAlert}}
6. GMAIL: Create Draft → To: {{output.leadEmail}} → Body: {{output.reEngagementEmail}}
```

---

## RECOMMENDED ZAPIER PLAN
For all 11 Zaps with multi-step workflows → **Zapier Professional** ($49/mo)
Sign up: https://zapier.com/pricing

## ESTIMATED SETUP TIME
| Zap | Time |
|---|---|
| Zaps #1-4 (Lead system) | 2-3 hours |
| Zaps #5-7 (Finance + contracts) | 1-2 hours |
| Zap #8 (Slack AI Hub) | 30 min |
| Zaps #9-11 (Reports + membership) | 1-2 hours |
| **Total** | **~5-7 hours** |

## SUPPORT
Questions? Post in #mgc-ai-hub:
`🤖 MGC-AI: Help me troubleshoot Zap #[number]`

---
*MGC Global Consulting LLC | Making Global Connections*
*mark@mgcglobalconsulting.com | 410.952.2846 | www.mgcglobalconsulting.com*
