# MGC GLOBAL CONSULTING — AGENTIC AUTOMATION SUITE
### "Making Global Connections" | www.mgcglobalconsulting.com

## THE 7 AUTOMATIONS

| # | Trigger | Claude Action | Output |
|---|---------|---------------|--------|
| 01 | Contact Form | Score lead 1-10, draft reply | Slack + Notion CRM |
| 02 | Calendly Booking | Pre-call brief + discovery Qs | Slack briefing |
| 03 | Membership Signup | 3-email welcome sequence | Slack + Notion |
| 04 | 8AM Daily Cron | Pipeline analysis + priorities | Slack daily briefing |
| 05 | Referral Submitted | Thank-you + outreach drafts | Slack + emails |
| 06 | Gmail Invoice | Extract amount/due date/action | Slack #mgc-finance |
| 07 | Slack "🤖 MGC-AI:" | Full agentic response | Thread reply |

## WEBHOOK ENDPOINTS (after deploy)
POST /api/contact-form
POST /api/calendly-booking
POST /api/membership-signup
POST /api/daily-briefing
POST /api/referral
POST /api/invoice-alert
POST /api/slack-ai

## ENV VARIABLES NEEDED
CLAUDE_API_KEY | SLACK_WEBHOOK_BRIEFING | SLACK_WEBHOOK_CLIENTS
SLACK_WEBHOOK_FINANCE | SLACK_BOT_TOKEN | NOTION_API_KEY
NOTION_LEADS_DB_ID | NOTION_MEMBERS_DB_ID

## DEPLOY: vercel deploy --prod (free tier works)

MGC Global Consulting LLC | mark@mgcglobalconsulting.com | 410.952.2846
