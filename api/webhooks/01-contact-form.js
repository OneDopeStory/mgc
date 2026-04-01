/**
 * MGC GLOBAL CONSULTING — AUTOMATION #1
 * Contact Form Submission Handler
 * 
 * TRIGGER: Contact form submitted on mgcglobalconsulting.com
 * ACTIONS:
 *   1. Send to Claude AI for lead scoring + personalized reply draft
 *   2. Post structured lead card to Slack #mgc-clients
 *   3. Send auto-reply email to prospect via Gmail
 *   4. Create CRM record in Notion
 * 
 * DEPLOY: Zapier > Webhooks by Zapier (Catch Hook) OR Vercel/Netlify Function
 * ============================================================
 */

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL; // #mgc-clients channel
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_ID = process.env.NOTION_LEADS_DB_ID;
const NOTION_CRM_DATA_SOURCE_ID = process.env.NOTION_CRM_DATA_SOURCE_ID;
const GMAIL_SERVICE_ACCOUNT = process.env.GMAIL_SERVICE_ACCOUNT;

// ─── STEP 1: Score the lead with Claude AI ─────────────────────────────────

async function scoreLead(formData) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: `You are the autonomous lead intelligence agent for MGC Global Consulting LLC 
("Making Global Connections"), founded by Mark G. Cartwright, CEO — Baltimore, MD.
Services: AI Consulting, Automation Architecture, CRM Optimization, Operational Systems, 
AI Workshops, Retainer Support, True Assist System.

Analyze the incoming contact form submission and return ONLY valid JSON — no markdown, 
no explanation, no backticks. Return this exact structure:
{
  "score": 1-10,
  "tier": "HOT | WARM | COLD",
  "service_match": "primary service they need",
  "estimated_value": "dollar range like $2,500-$5,000",
  "urgency": "HIGH | MEDIUM | LOW",
  "reply_subject": "personalized email subject line",
  "reply_body": "professional 3-paragraph auto-reply email body from Mark Cartwright",
  "slack_summary": "2-sentence lead summary for the team",
  "next_action": "specific next step for Mark to take",
  "red_flags": "any concerns or blank if none"
}`,
      messages: [{
        role: "user",
        content: `New form submission:
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone || "Not provided"}
Company: ${formData.company || "Not provided"}
Service Interest: ${formData.service}
Goal: ${formData.goal || "Not provided"}
Message: ${formData.message}
Submitted: ${new Date().toISOString()}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

// ─── STEP 2: Post to Slack #mgc-clients ────────────────────────────────────

async function postToSlack(formData, aiAnalysis) {
  const tierEmoji = { HOT: "🔥", WARM: "🟡", COLD: "🔵" };
  const urgencyColor = { HIGH: "#e74c3c", MEDIUM: "#f39c12", LOW: "#2ecc71" };

  const payload = {
    text: `New Lead: ${formData.name} — ${aiAnalysis.tier} (Score: ${aiAnalysis.score}/10)`,
    attachments: [{
      color: urgencyColor[aiAnalysis.urgency] || "#1a6bba",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${tierEmoji[aiAnalysis.tier]} New Lead — ${aiAnalysis.tier} | Score: ${aiAnalysis.score}/10`
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Name:*\n${formData.name}` },
            { type: "mrkdwn", text: `*Email:*\n${formData.email}` },
            { type: "mrkdwn", text: `*Phone:*\n${formData.phone || "—"}` },
            { type: "mrkdwn", text: `*Company:*\n${formData.company || "—"}` },
            { type: "mrkdwn", text: `*Service:*\n${formData.service}` },
            { type: "mrkdwn", text: `*Est. Value:*\n${aiAnalysis.estimated_value}` }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*AI Summary:*\n${aiAnalysis.slack_summary}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*⚡ Next Action:*\n${aiAnalysis.next_action}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formData.message ? `*Their Message:*\n_"${formData.message}"_` : "_No message provided_"
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "📅 Book Call" },
              url: "https://calendly.com/mark-mgcglobalconsulting/30min",
              style: "primary"
            },
            {
              type: "button",
              text: { type: "plain_text", text: "📧 View Draft Reply" },
              value: aiAnalysis.reply_body
            }
          ]
        },
        {
          type: "context",
          elements: [{
            type: "mrkdwn",
            text: `Submitted: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST | MGC Auto-Intelligence`
          }]
        }
      ]
    }]
  };

  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

// ─── STEP 3: Create Notion CRM Record ──────────────────────────────────────

async function createNotionRecord(formData, aiAnalysis) {
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      parent: { data_source_id: NOTION_CRM_DATA_SOURCE_ID },
      properties: {
        "Name": { title: [{ text: { content: formData.name } }] },
        "Email": { email: formData.email },
        "Phone": { phone_number: formData.phone || "" },
        "Company": { rich_text: [{ text: { content: formData.company || "" } }] },
        "Service Interest": { select: { name: formData.service } },
        "Lead Score": { number: aiAnalysis.score },
        "Tier": { select: { name: aiAnalysis.tier } },
        "Est. Value": { rich_text: [{ text: { content: aiAnalysis.estimated_value } }] },
        "Status": { select: { name: "New Lead" } },
        "Source": { select: { name: "Website Contact Form" } },
        "Next Action": { rich_text: [{ text: { content: aiAnalysis.next_action } }] },
        "Date Added": { date: { start: new Date().toISOString().split("T")[0] } }
      }
    })
  });
  return response.json();
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const formData = req.body;

    // Run lead scoring and all actions in parallel
    const aiAnalysis = await scoreLead(formData);

    await Promise.all([
      postToSlack(formData, aiAnalysis),
      createNotionRecord(formData, aiAnalysis)
    ]);

    res.status(200).json({
      success: true,
      message: "Lead captured and processed",
      score: aiAnalysis.score,
      tier: aiAnalysis.tier
    });

  } catch (err) {
    console.error("MGC Contact Form Handler Error:", err);
    res.status(500).json({ error: "Processing failed", detail: err.message });
  }
}
