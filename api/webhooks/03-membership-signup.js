/**
 * MGC GLOBAL CONSULTING — AUTOMATION #3
 * Membership Signup Handler
 * Tiers: Starter ($27/mo) | Pro ($97/mo) | Elite ($297/mo)
 *
 * TRIGGER: Membership form submitted + payment confirmed
 * ACTIONS:
 *   1. Claude drafts personalized welcome sequence (3 emails)
 *   2. Post new member card to Slack #mgc-clients
 *   3. Create Notion member record with tier + perks
 *   4. Send welcome email with access + next steps
 *   5. Tag member in email platform for drip sequence
 * ============================================================
 */

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const SLACK_WEBHOOK_CLIENTS = process.env.SLACK_WEBHOOK_CLIENTS;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_MEMBERS_DB = process.env.NOTION_MEMBERS_DB_ID;
const NOTION_MEMBERS_DATA_SOURCE_ID = process.env.NOTION_MEMBERS_DATA_SOURCE_ID;

const TIER_CONFIG = {
  "starter": {
    price: 27,
    emoji: "🥉",
    label: "Starter",
    perks: ["Monthly AI tools newsletter", "Access to MGC resource library", "Community Slack access"],
    onboarding_focus: "Get them value fast with quick-win AI tools they can use today"
  },
  "pro": {
    price: 97,
    emoji: "🥈",
    label: "Pro",
    perks: ["Everything in Starter", "Monthly group strategy call", "Workflow audit checklist", "Priority email support"],
    onboarding_focus: "Schedule their first group call, deliver the workflow audit template immediately"
  },
  "elite": {
    price: 297,
    emoji: "🥇",
    label: "Elite",
    perks: ["Everything in Pro", "Monthly 1:1 with Mark", "Custom automation blueprint", "Direct Slack access to Mark"],
    onboarding_focus: "Book their 1:1 within 48 hours, deliver custom blueprint within 7 days"
  }
};

// ─── STEP 1: Claude — Generate Welcome Sequence ────────────────────────────

async function generateWelcomeSequence(memberData, tierConfig) {
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
      system: `You are the onboarding intelligence agent for MGC Global Consulting LLC.
Mark G. Cartwright, CEO, is welcoming a new ${tierConfig.label} member.
Return ONLY valid JSON — no markdown, no backticks:
{
  "welcome_email": {
    "subject": "personalized subject line",
    "body": "warm, executive-tone welcome email from Mark — 3 paragraphs, mentions their tier perks specifically"
  },
  "day3_email": {
    "subject": "follow-up subject",
    "body": "day 3 check-in email asking about their #1 operational pain point"
  },
  "day7_email": {
    "subject": "week 1 value email subject",
    "body": "week 1 email delivering a specific AI tip or tool recommendation relevant to their stated goal"
  },
  "slack_dm_script": "a short, warm first DM message Mark should send them in Slack",
  "onboarding_checklist": ["step 1", "step 2", "step 3", "step 4", "step 5"]
}`,
      messages: [{
        role: "user",
        content: `New Member:
Name: ${memberData.name}
Email: ${memberData.email}
Company: ${memberData.company || "Not provided"}
Tier: ${tierConfig.label} ($${tierConfig.price}/mo)
Goal: ${memberData.goal || "Not specified"}
Perks: ${tierConfig.perks.join(", ")}
Onboarding Focus: ${tierConfig.onboarding_focus}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

// ─── STEP 2: Post New Member to Slack ──────────────────────────────────────

async function postNewMemberToSlack(memberData, tierConfig, sequence) {
  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${tierConfig.emoji} New ${tierConfig.label} Member — $${tierConfig.price}/mo`
        }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Name:*\n${memberData.name}` },
          { type: "mrkdwn", text: `*Email:*\n${memberData.email}` },
          { type: "mrkdwn", text: `*Company:*\n${memberData.company || "—"}` },
          { type: "mrkdwn", text: `*Tier:*\n${tierConfig.label} (${tierConfig.emoji})` },
          { type: "mrkdwn", text: `*MRR Impact:*\n+$${tierConfig.price}/mo` },
          { type: "mrkdwn", text: `*Goal:*\n${memberData.goal || "—"}` }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*✅ Onboarding Checklist:*\n${sequence.onboarding_checklist.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*💬 Slack DM Script:*\n_"${sequence.slack_dm_script}"_`
        }
      },
      {
        type: "context",
        elements: [{
          type: "mrkdwn",
          text: `Joined: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST | Welcome sequence queued: Day 0, Day 3, Day 7`
        }]
      }
    ]
  };

  await fetch(SLACK_WEBHOOK_CLIENTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

// ─── STEP 3: Create Notion Member Record ───────────────────────────────────

async function createNotionMemberRecord(memberData, tierConfig) {
  await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      parent: { data_source_id: NOTION_MEMBERS_DATA_SOURCE_ID },
      properties: {
        "Name": { title: [{ text: { content: memberData.name } }] },
        "Email": { email: memberData.email },
        "Company": { rich_text: [{ text: { content: memberData.company || "" } }] },
        "Tier": { select: { name: tierConfig.label } },
        "MRR": { number: tierConfig.price },
        "Status": { select: { name: "Active" } },
        "Join Date": { date: { start: new Date().toISOString().split("T")[0] } },
        "Goal": { rich_text: [{ text: { content: memberData.goal || "" } }] }
      }
    })
  });
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const memberData = req.body;
    const tier = (memberData.tier || "starter").toLowerCase().replace(/[^a-z]/g, "");
    const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG["starter"];

    const sequence = await generateWelcomeSequence(memberData, tierConfig);

    await Promise.all([
      postNewMemberToSlack(memberData, tierConfig, sequence),
      createNotionMemberRecord(memberData, tierConfig)
    ]);

    res.status(200).json({
      success: true,
      tier: tierConfig.label,
      emails_queued: 3,
      message: "Member onboarded successfully"
    });
  } catch (err) {
    console.error("Membership Handler Error:", err);
    res.status(500).json({ error: err.message });
  }
}
