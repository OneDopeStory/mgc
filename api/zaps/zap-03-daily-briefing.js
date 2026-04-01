/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #3 — DAILY MORNING BRIEFING (8AM EST)                 ║
 * ║  Trigger: Schedule by Zapier — Daily at 8:00 AM EST         ║
 * ║  Actions: Claude generates briefing → Slack #mgc-daily      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Schedule by Zapier → Every day → 8:00 AM
 * 2. Action 1: Google Sheets — Get many rows (yesterday's leads log)
 *              OR skip if no sheet; Claude will work with what's passed
 * 3. Action 2: Code by Zapier (JavaScript) — paste THIS file
 * 4. Action 3: Slack — Send to #mgc-daily-briefing
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.leadsYesterday   — number of leads from yesterday
 *   inputData.bookingsToday    — number of Calendly bookings today
 *   inputData.openInvoices     — number of open invoices
 *   inputData.pendingFollowups — comma-separated list of names needing follow-up
 *   inputData.activeClients    — current active client names (comma-separated)
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const SYSTEM_PROMPT = `You are the daily operations intelligence system for MGC Global Consulting LLC ("Making Global Connections"), Mark G. Cartwright, CEO.

Generate a crisp, action-oriented morning briefing for Mark. Tone: executive assistant — clear, prioritized, no fluff.

Produce JSON only (no markdown, no preamble):
{
  "greeting": "One sharp, motivational opening line personalized to MGC",
  "priorityList": "Top 3 things Mark should do first today, numbered and bold",
  "statsBlock": "Formatted stats summary (leads, bookings, invoices)",
  "followUpAlerts": "List of people needing follow-up with suggested action for each",
  "clientUpdates": "Any client updates or items to address",
  "dayStrategy": "One strategic insight or recommendation for the day",
  "quote": "One powerful business/leadership quote for the day"
}`;

async function runZap() {
  const {
    leadsYesterday = "0",
    bookingsToday = "0",
    openInvoices = "0",
    pendingFollowups = "None",
    activeClients = "Recycle-4-Life / Lancaster, Harris & Green",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  const today = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const userMsg = `Good morning. Generate today's briefing for Mark.

Date: ${today}
New leads yesterday: ${leadsYesterday}
Calendly bookings today: ${bookingsToday}
Open invoices: ${openInvoices}
Pending follow-ups: ${pendingFollowups}
Active clients: ${activeClients}
Website: www.mgcglobalconsulting.com`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }]
    })
  });

  if (!response.ok) throw new Error(`Claude error: ${response.status}`);
  const data = await response.json();
  const raw = data.content[0].text;

  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = { greeting: raw, priorityList: "", statsBlock: "", followUpAlerts: "", clientUpdates: "", dayStrategy: "", quote: "" };
  }

  // Build full Slack message
  const slackMsg = `🌅 *GOOD MORNING, MARK — MGC DAILY BRIEFING*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_${today}_

${parsed.greeting}

📊 *TODAY'S STATS*
${parsed.statsBlock}

🎯 *TOP 3 PRIORITIES*
${parsed.priorityList}

🔔 *FOLLOW-UP ALERTS*
${parsed.followUpAlerts}

👥 *CLIENT UPDATES*
${parsed.clientUpdates}

💡 *STRATEGY NOTE*
${parsed.dayStrategy}

📣 _"${parsed.quote}"_

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MGC Global Consulting | Making Global Connections`;

  return {
    slackMessage: slackMsg,
    greeting:     parsed.greeting,
    priorities:   parsed.priorityList,
    stats:        parsed.statsBlock,
    date:         today
  };
}

return await runZap();
