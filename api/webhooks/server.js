/**
 * MGC Global Consulting — Master Webhook Server
 * Handles all automations for www.mgcglobalconsulting.com
 * 
 * Deploy to: Railway / Render / Vercel / your own VPS
 * Node.js 18+
 */

const express = require("express");
const app = express();
app.use(express.json());

// ─── ENV CONFIG ──────────────────────────────────────────────────────────────
const CONFIG = {
  CLAUDE_API_KEY:        process.env.CLAUDE_API_KEY,
  SLACK_WEBHOOK_URL:     process.env.SLACK_WEBHOOK_URL,       // #mgc-ai-hub
  SLACK_FINANCE_WEBHOOK: process.env.SLACK_FINANCE_WEBHOOK,   // #mgc-finance
  SLACK_CLIENTS_WEBHOOK: process.env.SLACK_CLIENTS_WEBHOOK,   // #mgc-clients
  SLACK_BRIEFING_WEBHOOK:process.env.SLACK_BRIEFING_WEBHOOK,  // #mgc-daily-briefing
  SLACK_OPS_WEBHOOK:     process.env.SLACK_OPS_WEBHOOK,       // #recycle4life-ops
  SLACK_AI_HUB_WEBHOOK:  process.env.SLACK_AI_HUB_WEBHOOK,    // #mgc-ai-hub (referrals)
  NOTION_API_KEY:              process.env.NOTION_API_KEY,
  NOTION_CRM_DB:               process.env.NOTION_CRM_DB,
  NOTION_MEMBERS_DB:           process.env.NOTION_MEMBERS_DB,
  NOTION_CRM_DATA_SOURCE_ID:     process.env.NOTION_CRM_DATA_SOURCE_ID,
  NOTION_MEMBERS_DATA_SOURCE_ID: process.env.NOTION_MEMBERS_DATA_SOURCE_ID,
  EMAIL_FROM:            "mark@mgcglobalconsulting.com",
  SENDGRID_KEY:          process.env.SENDGRID_API_KEY,
  PORT:                  process.env.PORT || 3000,
};

const MGC_SYSTEM_PROMPT = `You are an elite autonomous AI agent for MGC Global Consulting LLC ("Making Global Connections"), founded by Mark G. Cartwright, CEO. Website: www.mgcglobalconsulting.com | Baltimore, MD 21202 | 410.952.2846.

AUTONOMY DIRECTIVES:
1. Execute and deliver complete outputs — no preambles
2. Think in systems, not single tasks  
3. Anticipate the next 3 moves after each task
4. Fill information gaps with intelligent assumptions; flag at end
5. Tone: Executive-level, direct, solutions-first

OUTPUT FORMAT:
✅ COMPLETED: [action taken]
📋 DETAILS: [full output]
⚠️ ASSUMPTIONS: [any gaps filled]
🔜 NEXT 3 MOVES: [proactive recommendations]`;

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

async function callClaude(userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: MGC_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "No response";
}

async function postToSlack(webhookUrl, blocks) {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });
}

async function addNotionRecord(dataSourceId, properties) {
  await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CONFIG.NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2025-09-03",
    },
    body: JSON.stringify({ parent: { data_source_id: dataSourceId }, properties }),
  });
}

// ─── ROUTE 1: CONTACT FORM ────────────────────────────────────────────────────
/**
 * Triggered by: Site contact form submission
 * Zapier Trigger: Webhook (POST) → this endpoint
 * Then: Claude drafts reply + routes to correct Slack channel + adds to Notion CRM
 */
app.post("/webhook/contact-form", async (req, res) => {
  res.json({ received: true });

  const { name, email, phone, company, service, goal, message } = req.body;

  // Route to right channel based on service
  const channelMap = {
    "AI Consulting & Strategy":     CONFIG.SLACK_CLIENTS_WEBHOOK,
    "Automation Architecture":      CONFIG.SLACK_CLIENTS_WEBHOOK,
    "CRM & Pipeline Optimization":  CONFIG.SLACK_CLIENTS_WEBHOOK,
    "Operational Systems Design":   CONFIG.SLACK_CLIENTS_WEBHOOK,
    "AI Education & Workshops":     CONFIG.SLACK_CLIENTS_WEBHOOK,
    "Retainer & Implementation":    CONFIG.SLACK_CLIENTS_WEBHOOK,
    "True Assist System":           CONFIG.SLACK_OPS_WEBHOOK,
    "Join Membership — Starter":    CONFIG.SLACK_CLIENTS_WEBHOOK,
    "Join Membership — Pro":        CONFIG.SLACK_CLIENTS_WEBHOOK,
    "Join Membership — Elite":      CONFIG.SLACK_CLIENTS_WEBHOOK,
    "Submit a Referral":            CONFIG.SLACK_AI_HUB_WEBHOOK,
    "Become a Referral Partner":    CONFIG.SLACK_AI_HUB_WEBHOOK,
  };
  const targetChannel = channelMap[service] || CONFIG.SLACK_WEBHOOK_URL;

  // Claude drafts a personalized reply email
  const claudeReply = await callClaude(
    `Draft a professional, warm reply email to a new MGC Global Consulting inquiry.
    Prospect Name: ${name}
    Company: ${company || "not provided"}
    Service Interest: ${service}
    Their Message: ${message}
    Goal: ${goal || "not specified"}
    
    The email should: acknowledge their specific interest, briefly confirm MGC can help, invite them to book a Calendly call at https://calendly.com/mark-mgcglobalconsulting/30min, and be signed by Mark G. Cartwright, CEO.`
  );

  // Post to Slack
  await postToSlack(targetChannel, [
    {
      type: "header",
      text: { type: "plain_text", text: `🆕 New Inquiry — ${service}` }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${name}` },
        { type: "mrkdwn", text: `*Email:*\n${email}` },
        { type: "mrkdwn", text: `*Phone:*\n${phone || "Not provided"}` },
        { type: "mrkdwn", text: `*Company:*\n${company || "Not provided"}` },
        { type: "mrkdwn", text: `*Service:*\n${service}` },
        { type: "mrkdwn", text: `*Goal:*\n${goal || "Not specified"}` },
      ]
    },
    { type: "section", text: { type: "mrkdwn", text: `*Message:*\n${message}` } },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: `*🤖 Claude's Drafted Reply:*\n${claudeReply}` } },
    {
      type: "actions",
      elements: [
        { type: "button", text: { type: "plain_text", text: "📧 Send Reply" }, style: "primary", value: email },
        { type: "button", text: { type: "plain_text", text: "📋 Add to CRM" }, value: "add_crm" },
        { type: "button", text: { type: "plain_text", text: "📅 Book Call" }, url: "https://calendly.com/mark-mgcglobalconsulting/30min" }
      ]
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `⏰ Received: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET | *NEXT ACTION REQUIRED:* Mark — review & send reply within 24hrs` }]
    }
  ]);

  // Add to Notion CRM
  await addNotionRecord(CONFIG.NOTION_CRM_DATA_SOURCE_ID, {
    "Name":    { title: [{ text: { content: name } }] },
    "Email":   { email },
    "Phone":   { phone_number: phone || "" },
    "Company": { rich_text: [{ text: { content: company || "" } }] },
    "Service": { select: { name: service } },
    "Status":  { select: { name: "New Lead" } },
    "Source":  { select: { name: "Website Contact Form" } },
    "Notes":   { rich_text: [{ text: { content: message } }] },
  });
});

// ─── ROUTE 2: MEMBERSHIP SIGNUP ───────────────────────────────────────────────
/**
 * Triggered by: Contact form "Join Membership" selection OR Stripe payment
 * Zapier Trigger: Stripe → New Payment OR Webhook POST
 */
app.post("/webhook/membership-signup", async (req, res) => {
  res.json({ received: true });

  const { name, email, phone, company, tier, amount } = req.body;
  // tier = "Starter" | "Pro" | "Elite"

  const tierDetails = {
    Starter: { price: "$27/mo", perks: "Monthly strategy call, email support, tool recommendations" },
    Pro:     { price: "$97/mo", perks: "Bi-weekly sessions, 24hr support, monthly automation builds, CRM optimization" },
    Elite:   { price: "$297/mo", perks: "Weekly sessions, same-day support, unlimited automation, full ops management" },
  };
  const details = tierDetails[tier] || tierDetails["Starter"];

  const onboardingDraft = await callClaude(
    `Draft a new member welcome email for MGC Global Consulting.
    Member: ${name} | Tier: ${tier} (${details.price})
    Company: ${company || "individual"} | Email: ${email}
    Tier Benefits: ${details.perks}
    
    Include: warm welcome, what to expect in first 48hrs, link to book their onboarding call at https://calendly.com/mark-mgcglobalconsulting/30min, and instructions to join #mgc-members Slack channel. Sign from Mark G. Cartwright, CEO.`
  );

  await postToSlack(CONFIG.SLACK_CLIENTS_WEBHOOK, [
    {
      type: "header",
      text: { type: "plain_text", text: `🎉 New ${tier} Member — ${name}` }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${name}` },
        { type: "mrkdwn", text: `*Email:*\n${email}` },
        { type: "mrkdwn", text: `*Tier:*\n${tier} — ${details.price}` },
        { type: "mrkdwn", text: `*Company:*\n${company || "Individual"}` },
      ]
    },
    { type: "section", text: { type: "mrkdwn", text: `*✉️ Onboarding Email Draft:*\n${onboardingDraft}` } },
    {
      type: "actions",
      elements: [
        { type: "button", text: { type: "plain_text", text: "✅ Send Welcome Email" }, style: "primary", value: email },
        { type: "button", text: { type: "plain_text", text: "📋 Create Notion Workspace" }, value: "notion" },
        { type: "button", text: { type: "plain_text", text: "📅 Schedule Onboarding" }, url: "https://calendly.com/mark-mgcglobalconsulting/30min" }
      ]
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `*NEXT ACTION REQUIRED:* Send welcome email + create Notion workspace within 2hrs` }]
    }
  ]);

  // Add to Notion Members DB
  await addNotionRecord(CONFIG.NOTION_MEMBERS_DATA_SOURCE_ID, {
    "Name":   { title: [{ text: { content: name } }] },
    "Email":  { email },
    "Tier":   { select: { name: tier } },
    "Status": { select: { name: "Active" } },
    "Start Date": { date: { start: new Date().toISOString().split("T")[0] } },
  });
});

// ─── ROUTE 3: CALENDLY BOOKING ────────────────────────────────────────────────
/**
 * Triggered by: Calendly webhook → invitee.created
 * Zapier Trigger: Calendly → New Invitee
 */
app.post("/webhook/calendly-booking", async (req, res) => {
  res.json({ received: true });

  const { name, email, start_time, event_type, questions_and_answers } = req.body;
  const answers = questions_and_answers?.map(q => `${q.question}: ${q.answer}`).join("\n") || "None";

  const prepBrief = await callClaude(
    `Create a pre-call briefing for Mark Cartwright at MGC Global Consulting.
    Prospect: ${name} | Email: ${email}
    Call Time: ${start_time} | Type: ${event_type}
    Their Answers: ${answers}
    
    Include: 3 smart discovery questions tailored to their situation, suggested talking points, likely pain points based on their answers, and 2 potential service recommendations. Format as a concise executive brief.`
  );

  await postToSlack(CONFIG.SLACK_WEBHOOK_URL, [
    {
      type: "header",
      text: { type: "plain_text", text: `📅 New Strategy Call — ${name}` }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${name}` },
        { type: "mrkdwn", text: `*Email:*\n${email}` },
        { type: "mrkdwn", text: `*Time:*\n${new Date(start_time).toLocaleString("en-US", { timeZone: "America/New_York" })} ET` },
        { type: "mrkdwn", text: `*Type:*\n${event_type}` },
      ]
    },
    { type: "section", text: { type: "mrkdwn", text: `*Intake Answers:*\n${answers}` } },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: `*🤖 Pre-Call Brief:*\n${prepBrief}` } },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `*NEXT ACTION REQUIRED:* Review brief before call. Send any pre-work to prospect if applicable.` }]
    }
  ]);

  // Add to Notion CRM
  await addNotionRecord(CONFIG.NOTION_CRM_DATA_SOURCE_ID, {
    "Name":   { title: [{ text: { content: name } }] },
    "Email":  { email },
    "Status": { select: { name: "Call Booked" } },
    "Source": { select: { name: "Calendly" } },
    "Notes":  { rich_text: [{ text: { content: answers } }] },
  });
});

// ─── ROUTE 4: REFERRAL SUBMISSION ─────────────────────────────────────────────
/**
 * Triggered by: Contact form "Submit a Referral" OR "Become Referral Partner"
 */
app.post("/webhook/referral", async (req, res) => {
  res.json({ received: true });

  const { referrerName, referrerEmail, referredName, referredEmail, referredCompany, notes, type } = req.body;
  const isPartner = type === "partner";

  const referralDraft = await callClaude(
    `Draft two emails for MGC Global Consulting:
    1) A thank-you email to the referrer: ${referrerName} (${referrerEmail}) for referring ${referredName} at ${referredCompany || "their company"}.
    2) An outreach email to the referred prospect: ${referredName} (${referredEmail}) mentioning they were referred by ${referrerName} and inviting them to book a free strategy call at https://calendly.com/mark-mgcglobalconsulting/30min.
    Context: ${notes || "No additional notes"}
    Sign from: Mark G. Cartwright, CEO — MGC Global Consulting`
  );

  await postToSlack(CONFIG.SLACK_WEBHOOK_URL, [
    {
      type: "header",
      text: { type: "plain_text", text: isPartner ? `🤝 New Referral Partner Request` : `📨 New Referral Received` }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Referrer:*\n${referrerName}\n${referrerEmail}` },
        { type: "mrkdwn", text: `*Referred:*\n${referredName}\n${referredEmail}` },
        { type: "mrkdwn", text: `*Company:*\n${referredCompany || "Not provided"}` },
        { type: "mrkdwn", text: `*Notes:*\n${notes || "None"}` },
      ]
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: `*🤖 Drafted Emails:*\n${referralDraft}` } },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `*NEXT ACTION REQUIRED:* Send both emails within 2hrs. Log referral source in CRM.` }]
    }
  ]);
});

// ─── ROUTE 5: STALE LEAD RECOVERY ────────────────────────────────────────────
/**
 * Triggered by: Zapier Schedule — runs daily
 * Checks Notion CRM for leads with "New Lead" status older than 48hrs
 */
app.post("/webhook/stale-lead-check", async (req, res) => {
  res.json({ received: true });

  const { staleLeads } = req.body; // Array from Zapier Notion query
  if (!staleLeads?.length) return;

  for (const lead of staleLeads) {
    const followUp = await callClaude(
      `Write a brief, natural follow-up email to a prospect who hasn't responded to MGC Global Consulting.
      Name: ${lead.name} | Service Interest: ${lead.service}
      Days Since Contact: ${lead.daysSince}
      Original Message: ${lead.originalMessage || "Initial inquiry"}
      
      Keep it short (3-4 sentences), warm but not desperate, reference their specific service interest, and include Calendly link. Sign from Mark.`
    );

    await postToSlack(CONFIG.SLACK_WEBHOOK_URL, [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `⚠️ *Stale Lead — ${lead.daysSince} days:* ${lead.name} (${lead.service})\n\n*Follow-up Draft:*\n${followUp}`
        }
      },
      {
        type: "actions",
        elements: [
          { type: "button", text: { type: "plain_text", text: "📧 Send Follow-Up" }, style: "primary", value: lead.email },
          { type: "button", text: { type: "plain_text", text: "❌ Mark Dead" }, value: `dead_${lead.id}` }
        ]
      }
    ]);
  }
});

// ─── ROUTE 6: INVOICE ALERT ───────────────────────────────────────────────────
/**
 * Triggered by: Gmail webhook via Zapier — new email with invoice/payment subject
 * OR: Manual invoice creation event
 */
app.post("/webhook/invoice-alert", async (req, res) => {
  res.json({ received: true });

  const { clientName, invoiceNumber, amount, dueDate, services, status, emailBody } = req.body;

  const summary = await callClaude(
    `Analyze this invoice situation for MGC Global Consulting and provide a brief financial summary + action plan.
    Client: ${clientName} | Invoice: ${invoiceNumber}
    Amount: $${amount} | Due: ${dueDate} | Status: ${status}
    Services: ${services}
    ${emailBody ? `Email Context: ${emailBody}` : ""}
    
    Flag any risk, note payment terms (5% late fee after 7 days), and recommend next step.`
  );

  await postToSlack(CONFIG.SLACK_FINANCE_WEBHOOK, [
    {
      type: "header",
      text: { type: "plain_text", text: `💰 Invoice ${status} — ${clientName}` }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Invoice #:*\n${invoiceNumber}` },
        { type: "mrkdwn", text: `*Amount:*\n$${amount}` },
        { type: "mrkdwn", text: `*Due Date:*\n${dueDate}` },
        { type: "mrkdwn", text: `*Status:*\n${status}` },
        { type: "mrkdwn", text: `*Services:*\n${services}` },
      ]
    },
    { type: "section", text: { type: "mrkdwn", text: `*🤖 Financial Analysis:*\n${summary}` } },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `*NEXT ACTION REQUIRED:* Mark — review & follow up if overdue. Capital One Acct: #36059083952` }]
    }
  ]);
});

// ─── ROUTE 7: TRUE ASSIST INTAKE ─────────────────────────────────────────────
/**
 * Triggered by: True Assist intake form (Notion form / Typeform / JotForm)
 * Routes to correct department automatically
 */
app.post("/webhook/true-assist-intake", async (req, res) => {
  res.json({ received: true });

  const { clientName, clientEmail, phone, company, intakeType, details, urgency } = req.body;

  const routingDecision = await callClaude(
    `You are the True Assist routing system for MGC Global Consulting.
    New intake received:
    Client: ${clientName} | Company: ${company} | Type: ${intakeType}
    Urgency: ${urgency} | Details: ${details}
    
    Determine:
    1. Which MGC service department should handle this (AI Consulting / Automation / CRM / Operations / Education / Retainer)
    2. Priority level (High/Medium/Low)
    3. Estimated timeline to deliver
    4. First 3 action steps the assigned team member should take
    5. Draft a 2-sentence acknowledgment message to send to the client immediately`
  );

  // Determine urgency color
  const color = urgency === "High" ? "🔴" : urgency === "Medium" ? "🟡" : "🟢";

  await postToSlack(CONFIG.SLACK_OPS_WEBHOOK, [
    {
      type: "header",
      text: { type: "plain_text", text: `${color} True Assist Intake — ${intakeType}` }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Client:*\n${clientName}` },
        { type: "mrkdwn", text: `*Email:*\n${clientEmail}` },
        { type: "mrkdwn", text: `*Company:*\n${company || "N/A"}` },
        { type: "mrkdwn", text: `*Urgency:*\n${urgency}` },
        { type: "mrkdwn", text: `*Type:*\n${intakeType}` },
      ]
    },
    { type: "section", text: { type: "mrkdwn", text: `*Details:*\n${details}` } },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: `*🤖 Routing Decision & Action Plan:*\n${routingDecision}` } },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `⏰ ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET | Logged to Notion CRM automatically` }]
    }
  ]);

  // Log to Notion
  await addNotionRecord(CONFIG.NOTION_CRM_DATA_SOURCE_ID, {
    "Name":   { title: [{ text: { content: clientName } }] },
    "Email":  { email: clientEmail },
    "Phone":  { phone_number: phone || "" },
    "Status": { select: { name: "In Progress" } },
    "Source": { select: { name: "True Assist Intake" } },
    "Notes":  { rich_text: [{ text: { content: details } }] },
  });
});

// ─── ROUTE 8: DAILY MORNING BRIEFING ─────────────────────────────────────────
/**
 * Triggered by: Zapier Schedule — every weekday at 8:00 AM ET
 * Payload: Zapier sends last 24hr Slack summary + Notion data
 */
app.post("/webhook/daily-briefing", async (req, res) => {
  res.json({ received: true });

  const { newLeads, pendingFollowUps, openInvoices, recentMessages, calendarEvents } = req.body;

  const briefing = await callClaude(
    `Generate the MGC Global Consulting daily morning executive briefing for Mark Cartwright.
    Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
    
    DATA:
    - New Leads (24hrs): ${JSON.stringify(newLeads || [])}
    - Pending Follow-Ups: ${JSON.stringify(pendingFollowUps || [])}
    - Open Invoices: ${JSON.stringify(openInvoices || [])}
    - Today's Calendar: ${JSON.stringify(calendarEvents || [])}
    - Recent Slack Activity: ${recentMessages || "None"}
    
    Format as a crisp executive brief with sections: 🎯 TODAY'S PRIORITIES, 📊 PIPELINE STATUS, 💰 REVENUE STATUS, ⚡ QUICK WINS, 🔜 THIS WEEK'S FOCUS. Max 300 words. End with NEXT 3 MOVES for the day.`
  );

  await postToSlack(CONFIG.SLACK_BRIEFING_WEBHOOK, [
    {
      type: "header",
      text: { type: "plain_text", text: `☀️ MGC Daily Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}` }
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: briefing }
    },
    {
      type: "divider"
    },
    {
      type: "actions",
      elements: [
        { type: "button", text: { type: "plain_text", text: "📋 View CRM" }, url: "https://notion.so" },
        { type: "button", text: { type: "plain_text", text: "📅 View Calendar" }, url: "https://calendly.com/mark-mgcglobalconsulting" },
        { type: "button", text: { type: "plain_text", text: "🌐 View Site" }, url: "https://www.mgcglobalconsulting.com" }
      ]
    }
  ]);
});

// ─── ROUTE 9: WORKSHOP INQUIRY ────────────────────────────────────────────────
/**
 * Triggered by: "AI Education & Workshops" form selection
 * Routes to education pipeline with custom proposal draft
 */
app.post("/webhook/workshop-inquiry", async (req, res) => {
  res.json({ received: true });

  const { name, email, company, teamSize, industry, format, goals } = req.body;

  const proposal = await callClaude(
    `Draft a concise workshop proposal outline for MGC Global Consulting.
    Client: ${name} | Company: ${company} | Industry: ${industry}
    Team Size: ${teamSize} | Preferred Format: ${format}
    Goals: ${goals}
    
    Include: recommended workshop format (Executive Briefing / Team Bootcamp / Transformation Program), suggested topics from MGC's 8 workshop modules, estimated timeline, next steps. Keep it compelling and specific to their industry.`
  );

  await postToSlack(CONFIG.SLACK_CLIENTS_WEBHOOK, [
    {
      type: "header",
      text: { type: "plain_text", text: `🎓 Workshop Inquiry — ${company}` }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Contact:*\n${name}\n${email}` },
        { type: "mrkdwn", text: `*Company:*\n${company}` },
        { type: "mrkdwn", text: `*Industry:*\n${industry}` },
        { type: "mrkdwn", text: `*Team Size:*\n${teamSize}` },
        { type: "mrkdwn", text: `*Format:*\n${format}` },
      ]
    },
    { type: "section", text: { type: "mrkdwn", text: `*Goals:*\n${goals}` } },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: `*🤖 Proposed Workshop Plan:*\n${proposal}` } },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `*NEXT ACTION REQUIRED:* Refine proposal → send within 24hrs → book discovery call` }]
    }
  ]);
});

// ─── ROUTE 10: WEEKLY PIPELINE SUMMARY ───────────────────────────────────────
/**
 * Triggered by: Zapier Schedule — Every Friday at 4:00 PM ET
 */
app.post("/webhook/weekly-summary", async (req, res) => {
  res.json({ received: true });

  const { weekData } = req.body;

  const summary = await callClaude(
    `Generate the MGC Global Consulting weekly operations summary.
    Week of: ${new Date().toLocaleDateString()}
    Data: ${JSON.stringify(weekData || {})}
    
    Include: 📊 WEEK IN NUMBERS (leads, calls, proposals, revenue), 🏆 WINS, ⚠️ GAPS & RISKS, 📈 TRENDS, 🔜 NEXT WEEK FOCUS. Executive-level, data-driven, under 250 words.`
  );

  await postToSlack(CONFIG.SLACK_BRIEFING_WEBHOOK, [
    {
      type: "header",
      text: { type: "plain_text", text: `📊 MGC Weekly Summary — Week of ${new Date().toLocaleDateString()}` }
    },
    { type: "section", text: { type: "mrkdwn", text: summary } }
  ]);
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "✅ MGC Webhook Server — Online",
    company: "MGC Global Consulting LLC",
    website: "www.mgcglobalconsulting.com",
    routes: [
      "POST /webhook/contact-form",
      "POST /webhook/membership-signup",
      "POST /webhook/calendly-booking",
      "POST /webhook/referral",
      "POST /webhook/stale-lead-check",
      "POST /webhook/invoice-alert",
      "POST /webhook/true-assist-intake",
      "POST /webhook/daily-briefing",
      "POST /webhook/workshop-inquiry",
      "POST /webhook/weekly-summary",
    ],
    timestamp: new Date().toISOString()
  });
});

app.listen(CONFIG.PORT, () => {
  console.log(`🚀 MGC Webhook Server running on port ${CONFIG.PORT}`);
});

module.exports = app;
