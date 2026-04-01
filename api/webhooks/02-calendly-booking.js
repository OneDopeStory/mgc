/**
 * MGC GLOBAL CONSULTING — AUTOMATION #2
 * Calendly Strategy Call Booking Handler
 *
 * TRIGGER: New Calendly booking via Zapier Calendly integration
 * ACTIONS:
 *   1. Claude drafts a personalized pre-call brief for Mark
 *   2. Post booking card to Slack #mgc-daily-briefing
 *   3. Send prospect a prep email with homework/agenda
 *   4. Create/update Notion CRM record with call status
 *   5. Add to #recycle4life-ops if client matches
 * ============================================================
 */

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const SLACK_WEBHOOK_BRIEFING = process.env.SLACK_WEBHOOK_BRIEFING; // #mgc-daily-briefing
const SLACK_WEBHOOK_CLIENTS = process.env.SLACK_WEBHOOK_CLIENTS;   // #mgc-clients
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_ID = process.env.NOTION_LEADS_DB_ID;
const NOTION_CRM_DATA_SOURCE_ID = process.env.NOTION_CRM_DATA_SOURCE_ID;

// ─── STEP 1: Claude — Generate Pre-Call Brief ──────────────────────────────

async function generatePreCallBrief(bookingData) {
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
      system: `You are the autonomous pre-call intelligence agent for MGC Global Consulting LLC.
Mark G. Cartwright is about to have a 30-minute strategy call. Your job is to prepare him.
Return ONLY valid JSON — no markdown, no backticks:
{
  "prospect_profile": "2-3 sentence summary of who this person likely is based on their info",
  "pain_points": ["likely pain point 1", "likely pain point 2", "likely pain point 3"],
  "recommended_services": ["service 1", "service 2"],
  "opening_question": "the best first question Mark should ask",
  "discovery_questions": ["q1", "q2", "q3", "q4"],
  "close_strategy": "recommended closing approach for this call type",
  "prep_homework_email": "email to send prospect asking them to prepare 3 things before the call",
  "estimated_deal_size": "dollar range",
  "call_objective": "primary goal for this specific call"
}`,
      messages: [{
        role: "user",
        content: `Calendly Booking:
Name: ${bookingData.name}
Email: ${bookingData.email}
Company: ${bookingData.company || "Unknown"}
Call Time: ${bookingData.start_time}
Event Type: ${bookingData.event_type || "30-Minute Strategy Call"}
Questions Answered: ${JSON.stringify(bookingData.questions_and_answers || {})}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

// ─── STEP 2: Post to Slack ──────────────────────────────────────────────────

async function postBookingToSlack(bookingData, brief) {
  const callTime = new Date(bookingData.start_time).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  const payload = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📅 New Strategy Call Booked" }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Prospect:*\n${bookingData.name}` },
          { type: "mrkdwn", text: `*Email:*\n${bookingData.email}` },
          { type: "mrkdwn", text: `*Company:*\n${bookingData.company || "—"}` },
          { type: "mrkdwn", text: `*Call Time:*\n${callTime} EST` },
          { type: "mrkdwn", text: `*Est. Deal:*\n${brief.estimated_deal_size}` },
          { type: "mrkdwn", text: `*Objective:*\n${brief.call_objective}` }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🧠 AI Profile:*\n${brief.prospect_profile}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*💡 Recommended Services:*\n${brief.recommended_services.map(s => `• ${s}`).join("\n")}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🎯 Opening Question:*\n_"${brief.opening_question}"_`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📋 Discovery Questions:*\n${brief.discovery_questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📅 View in Calendly" },
            url: "https://calendly.com/mark-mgcglobalconsulting",
            style: "primary"
          }
        ]
      },
      {
        type: "context",
        elements: [{
          type: "mrkdwn",
          text: `Auto-brief by MGC AI | ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST`
        }]
      }
    ]
  };

  await Promise.all([
    fetch(SLACK_WEBHOOK_BRIEFING, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
    fetch(SLACK_WEBHOOK_CLIENTS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `📅 *Strategy call booked:* ${bookingData.name} (${bookingData.company || "Unknown"}) — ${callTime} EST` })
    })
  ]);
}

// ─── STEP 3: Update Notion CRM ─────────────────────────────────────────────

async function updateNotionCRM(bookingData, brief) {
  // Search for existing record first
  const searchRes = await fetch(`https://api.notion.com/v1/data_sources/${NOTION_CRM_DATA_SOURCE_ID}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filter: { property: "Email", email: { equals: bookingData.email } }
    })
  });
  const searchData = await searchRes.json();

  const props = {
    "Status": { select: { name: "Call Booked" } },
    "Call Date": { date: { start: bookingData.start_time } },
    "Next Action": { rich_text: [{ text: { content: `Prep call brief — ${brief.call_objective}` } }] }
  };

  if (searchData.results?.length > 0) {
    // Update existing
    await fetch(`https://api.notion.com/v1/pages/${searchData.results[0].id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2025-09-03",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ properties: props })
    });
  } else {
    // Create new
    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2025-09-03",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: { data_source_id: NOTION_CRM_DATA_SOURCE_ID },
        properties: {
          "Name": { title: [{ text: { content: bookingData.name } }] },
          "Email": { email: bookingData.email },
          "Company": { rich_text: [{ text: { content: bookingData.company || "" } }] },
          "Source": { select: { name: "Calendly" } },
          ...props
        }
      })
    });
  }
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const bookingData = req.body.payload || req.body;
    const brief = await generatePreCallBrief(bookingData);

    await Promise.all([
      postBookingToSlack(bookingData, brief),
      updateNotionCRM(bookingData, brief)
    ]);

    res.status(200).json({ success: true, message: "Booking processed" });
  } catch (err) {
    console.error("Calendly Handler Error:", err);
    res.status(500).json({ error: err.message });
  }
}
