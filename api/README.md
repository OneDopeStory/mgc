# MGC Global Consulting — Automation Stack
## Complete Webhook + Zapier + Claude AI Integration
**www.mgcglobalconsulting.com** | Mark G. Cartwright, CEO

---

## 🏗️ WHAT THIS DOES

10 fully automated workflows covering every touchpoint on the MGC site:

| # | Automation | Trigger | Output |
|---|-----------|---------|--------|
| 1 | **Contact Form Router** | Form submission | Claude-drafted reply → Slack + Notion CRM |
| 2 | **Membership Onboarding** | Membership signup | Welcome email + Notion member record |
| 3 | **Calendly Pre-Brief** | New booking | AI pre-call brief → Slack + Calendar note |
| 4 | **Referral Dual Outreach** | Referral submitted | Thank-you + prospect outreach emails |
| 5 | **Stale Lead Recovery** | Daily 9AM | Follow-up drafts for cold leads |
| 6 | **Invoice Alerts** | Gmail invoice email | Finance Slack alert + analysis |
| 7 | **True Assist Intake** | Intake form | Department routing + Notion log |
| 8 | **Daily Briefing** | Weekdays 8AM | Executive morning summary → Slack |
| 9 | **Workshop Proposals** | Workshop inquiry | AI proposal draft → Slack |
| 10 | **Weekly Summary** | Fridays 4PM | Pipeline + revenue recap → Slack |

---

## 🚀 DEPLOY IN 15 MINUTES (Railway — Recommended)

### Step 1: Prep Your Code
```bash
# Clone or create a new repo on GitHub
git init mgc-webhooks
cd mgc-webhooks
# Copy all files from this package into it
git add .
git commit -m "MGC automation stack v1"
git push origin main
```

### Step 2: Deploy to Railway
1. Go to **railway.app** → New Project → Deploy from GitHub
2. Select your `mgc-webhooks` repo
3. Click **Variables** → Add all vars from `.env.template`
4. Railway auto-deploys → gives you a URL like `https://mgc-webhooks.up.railway.app`

### Step 3: Get Your Slack Webhook URLs
For each channel (#mgc-ai-hub, #mgc-finance, etc.):
1. Go to **api.slack.com/apps** → Your App → Incoming Webhooks
2. Click "Add New Webhook to Workspace"
3. Select the channel → Copy the URL → paste into Railway env vars

### Step 4: Set Up Notion Integration
1. Go to **notion.so/my-integrations** → New Integration → Name: "MGC Automation"
2. Copy the secret → paste as `NOTION_API_KEY`
3. Open your CRM database in Notion → Share → Invite "MGC Automation"
4. Copy DB ID from URL → paste as `NOTION_CRM_DB`

### Step 5: Build the Zapier Zaps
Reference `zapier-configs/all-zaps.yaml` for step-by-step config.
Replace `[your-server]` with your Railway URL in every Zap.

### Step 6: Test Everything
```bash
TEST_URL=https://mgc-webhooks.up.railway.app node test/test-all-routes.js
```
All 10 should return ✅

---

## 📁 FILE STRUCTURE

```
mgc-automations/
├── webhooks/
│   └── server.js          ← Main server (10 routes)
├── zapier-configs/
│   └── all-zaps.yaml      ← Step-by-step Zapier config
├── test/
│   └── test-all-routes.js ← Test all 10 endpoints
├── .env.template          ← Copy → .env, fill in values
├── package.json
└── README.md
```

---

## 💰 ESTIMATED MONTHLY COSTS

| Service | Plan | Cost |
|---------|------|------|
| Railway (hosting) | Hobby | ~$5/mo |
| Claude API (Sonnet) | Pay per use | ~$10-30/mo |
| Zapier | Professional | $49/mo |
| Slack | Pro | $7.25/user/mo |
| Notion | Plus | $8/mo |
| **TOTAL** | | **~$80-100/mo** |

*vs hiring someone to do this manually: $3,000-5,000/mo*

---

## 🔧 CUSTOMIZATION

### Add a new automation:
1. Add route to `server.js`: `app.post("/webhook/new-route", async (req, res) => {...})`
2. Add Zap config to `all-zaps.yaml`
3. Add test case to `test-all-routes.js`
4. Deploy (Railway auto-redeploys on git push)

### Adjust Claude's behavior:
Edit `MGC_SYSTEM_PROMPT` at the top of `server.js`

---

## 📞 SUPPORT
MGC Global Consulting LLC
mark@mgcglobalconsulting.com | 410.952.2846
www.mgcglobalconsulting.com
101 W. Lombard St., Baltimore, MD 21202
