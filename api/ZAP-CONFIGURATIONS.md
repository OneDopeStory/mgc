# MGC GLOBAL CONSULTING — ZAPIER ZAP CONFIGURATIONS
# Complete setup guide for all 7 automations
# www.mgcglobalconsulting.com
# ============================================================

## ENVIRONMENT VARIABLES NEEDED
# Add these to your deployment platform (Vercel / Netlify / Railway):

CLAUDE_API_KEY=sk-ant-...              # From console.anthropic.com
SLACK_WEBHOOK_BRIEFING=https://hooks.slack.com/...    # #mgc-daily-briefing
SLACK_WEBHOOK_CLIENTS=https://hooks.slack.com/...     # #mgc-clients
SLACK_WEBHOOK_FINANCE=https://hooks.slack.com/...     # #mgc-finance
SLACK_BOT_TOKEN=xoxb-...              # From api.slack.com/apps
NOTION_API_KEY=secret_...             # From notion.so/my-integrations
NOTION_LEADS_DB_ID=...                # From your Notion leads database URL
NOTION_MEMBERS_DB_ID=...              # From your Notion members database URL

## ─── ZAP #1: CONTACT FORM → CLAUDE → SLACK + NOTION ──────────────────────
## Trigger:   Webhooks by Zapier → Catch Hook
##            URL: https://YOUR_DOMAIN/api/contact-form
## Action 1:  Webhooks by Zapier → POST to your deployed webhook URL
## Result:    Lead scored, Slack notified, Notion CRM updated

## Zapier Webhook Body (Zap #1):
{
  "name": "{{Full Name}}",
  "email": "{{Email Address}}",
  "phone": "{{Phone Number}}",
  "company": "{{Company}}",
  "service": "{{How Can We Help You}}",
  "goal": "{{Whats your main goal}}",
  "message": "{{Tell Us More}}"
}

## ─── ZAP #2: CALENDLY → CLAUDE PRE-CALL BRIEF → SLACK ────────────────────
## Trigger:   Calendly → Invitee Created
## Action 1:  Webhooks by Zapier → POST
## URL:       https://YOUR_DOMAIN/api/calendly-booking

## Zapier Webhook Body (Zap #2):
{
  "name": "{{Invitee Name}}",
  "email": "{{Invitee Email}}",
  "company": "{{Answer to Q: Company}}",
  "start_time": "{{Start Time}}",
  "event_type": "{{Event Type Name}}",
  "questions_and_answers": {
    "goal": "{{Answer to Q: What is your main goal}}",
    "challenge": "{{Answer to Q: Current challenge}}"
  }
}

## ─── ZAP #3: MEMBERSHIP FORM → CLAUDE → SLACK + NOTION ──────────────────
## Trigger:   Webhooks by Zapier → Catch Hook
##            OR: Stripe → New Customer (if using Stripe for payments)
## Action 1:  Webhooks by Zapier → POST
## URL:       https://YOUR_DOMAIN/api/membership-signup

## Zapier Webhook Body (Zap #3):
{
  "name": "{{Full Name}}",
  "email": "{{Email Address}}",
  "company": "{{Company}}",
  "tier": "{{Membership Tier}}",
  "goal": "{{Whats your main goal as a member}}"
}

## ─── ZAP #4: SCHEDULED DAILY BRIEFING ────────────────────────────────────
## Trigger:   Schedule by Zapier → Every Day → 8:00 AM EST
## Action 1:  Webhooks by Zapier → POST
## URL:       https://YOUR_DOMAIN/api/daily-briefing
## Body:      {} (empty — handler pulls data from Notion automatically)

## ─── ZAP #5: REFERRAL SUBMISSION ─────────────────────────────────────────
## Trigger:   Webhooks by Zapier → Catch Hook
##            (fire when contact form service = "Submit a Referral")
## Action 1:  Filter by Zapier → Only continue if {{Service}} = "Submit a Referral"
## Action 2:  Webhooks by Zapier → POST
## URL:       https://YOUR_DOMAIN/api/referral

## Zapier Webhook Body (Zap #5):
{
  "name": "{{Full Name}}",
  "email": "{{Email Address}}",
  "referred_name": "{{Referred Persons Name}}",
  "referred_email": "{{Referred Persons Email}}",
  "message": "{{Tell Us More}}"
}

## ─── ZAP #6: GMAIL INVOICE ALERT ─────────────────────────────────────────
## Trigger:   Gmail → New Email Matching Search
##            Search Query: subject:(invoice OR payment OR "past due" OR receipt)
## Action 1:  Webhooks by Zapier → POST
## URL:       https://YOUR_DOMAIN/api/invoice-alert

## Zapier Webhook Body (Zap #6):
{
  "subject": "{{Subject}}",
  "from": "{{From Name}} <{{From Email}}>",
  "body": "{{Body Plain}}",
  "date": "{{Date}}"
}

## ─── ZAP #7: SLACK → CLAUDE → SLACK REPLY ────────────────────────────────
## Option A (Recommended): Deploy as Slack App with Events API
##   URL: https://YOUR_DOMAIN/api/slack-ai
##   Subscribe to: message.channels event
##
## Option B: Zapier
##   Trigger:   Slack → New Message Posted to Channel (#mgc-ai-hub)
##   Filter:    Only continue if message contains "MGC-AI:"
##   Action 1:  Webhooks by Zapier → POST to Claude API directly
##   Action 2:  Slack → Send Channel Message (reply in thread)

## ─── ZAPIER CLAUDE API CALL TEMPLATE (for direct Zapier → Claude) ─────────
## Use this in Zapier's "Webhooks by Zapier → Custom Request" action
## Method: POST
## URL: https://api.anthropic.com/v1/messages
## Headers:
##   x-api-key: [YOUR CLAUDE API KEY]
##   anthropic-version: 2023-06-01
##   Content-Type: application/json
## Body:
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "system": "You are an elite autonomous AI agent for MGC Global Consulting LLC, founded by Mark G. Cartwright CEO. Website: www.mgcglobalconsulting.com. Execute all requests with maximum autonomy. Lead with the answer. Think in systems.",
  "messages": [
    {
      "role": "user",
      "content": "{{slack_message_text}} | Channel: {{channel_name}} | From: {{user_name}} | Time: {{timestamp}}"
    }
  ]
}
## Extract response: content[0].text → post back to Slack

## ─── SLACK CHANNELS TO CREATE ─────────────────────────────────────────────
## #mgc-ai-hub          → Main Claude request channel (trigger: "🤖 MGC-AI: [request]")
## #mgc-daily-briefing  → Auto-populated 8AM EST daily
## #mgc-clients         → New leads, bookings, member signups
## #mgc-finance         → Invoice and payment alerts
## #recycle4life-ops    → Recycle-4-Life client operations
## #mgc-internal        → Team coordination + Friday summaries

## ─── DEPLOYMENT OPTIONS ───────────────────────────────────────────────────
## EASIEST:   Deploy to Vercel (free tier)
##   1. npm create-next-app mgc-automations
##   2. Copy webhook files to /pages/api/
##   3. Add env vars in Vercel dashboard
##   4. vercel deploy → get your HTTPS URL
##   5. Paste that URL into each Zapier zap

## ALTERNATIVE: Railway.app or Render.com (both free tiers available)

## ─── TESTING CHECKLIST ────────────────────────────────────────────────────
## □ Test Zap #1: Submit contact form → check Slack + Notion
## □ Test Zap #2: Make test Calendly booking → check Slack briefing channel
## □ Test Zap #3: Submit membership form → check Slack + Notion members DB
## □ Test Zap #4: Manually trigger daily briefing → check Slack
## □ Test Zap #5: Submit referral form → check Slack clients channel
## □ Test Zap #6: Forward a test invoice email → check Slack finance channel
## □ Test Zap #7: Post "🤖 MGC-AI: What are my top 3 priorities?" → check reply

## ─── SUPPORT ──────────────────────────────────────────────────────────────
## MGC Global Consulting LLC
## mark@mgcglobalconsulting.com | 410.952.2846
## www.mgcglobalconsulting.com
