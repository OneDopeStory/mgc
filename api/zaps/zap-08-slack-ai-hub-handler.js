/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #8 — SLACK AI HUB MESSAGE HANDLER                    ║
 * ║  Trigger: New message in #mgc-ai-hub starting with "🤖"    ║
 * ║  Actions: Claude processes any task → Reply in thread       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Slack — New Message Posted to Channel (#mgc-ai-hub)
 *              Filter: message text starts with "🤖" or "MGC-AI:"
 * 2. Action 1: Filter by Zapier — only if message contains trigger phrase
 * 3. Action 2: Code by Zapier — paste THIS file
 * 4. Action 3: Slack — Send Channel Message (reply in thread)
 *
 * HOW TO USE IN SLACK:
 *   Post any message in #mgc-ai-hub starting with:
 *   🤖 MGC-AI: [your request]
 *
 *   Examples:
 *   🤖 MGC-AI: Draft a follow-up email for Anthony Harris at Recycle-4-Life
 *   🤖 MGC-AI: Create a proposal for a new CRM client paying $5,000
 *   🤖 MGC-AI: What should my next 3 priorities be today?
 *   🤖 MGC-AI: Write a LinkedIn post about our AI automation services
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.slackMessage     — full message text from Slack
 *   inputData.senderName       — Slack user who sent it
 *   inputData.channel          — channel name
 *   inputData.timestamp        — message timestamp
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const MASTER_PROMPT = `You are an elite autonomous AI agent and Chief Operations Architect for MGC Global Consulting LLC ("Making Global Connections"), founded by Mark G. Cartwright, CEO.

COMPANY: MGC Global Consulting LLC | 101 W. Lombard St., Baltimore, MD 21202
EMAIL: mark@mgcglobalconsulting.com | PHONE: 410.952.2846 | WEB: www.mgcglobalconsulting.com
CALENDLY: https://calendly.com/mark-mgcglobalconsulting/30min
ACTIVE CLIENT: Recycle-4-Life / Lancaster, Harris & Green Company (Anthony Harris)
SERVICES: AI Consulting & Strategy, Automation Architecture, CRM Optimization, Operational Systems Design, AI Education & Workshops, Retainer & Implementation

AUTONOMY DIRECTIVES:
1. EXECUTE BEFORE EXPLAINING — deliver the finished output first
2. FILL THE GAPS — make intelligent assumptions; flag at the end
3. ANTICIPATE THE NEXT 3 MOVES — always close with next actions for Mark

ALWAYS FORMAT RESPONSES FOR SLACK:
- Use *bold* for headers
- Use bullet points for lists
- End with: 🔜 *NEXT 3 MOVES:* [recommendations]
- Keep under 800 words`;

async function runZap() {
  const {
    slackMessage = "",
    senderName = "Mark",
    channel = "#mgc-ai-hub",
    timestamp = "",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  // Strip the trigger prefix
  const cleanMessage = slackMessage
    .replace(/^🤖\s*/i, "")
    .replace(/^MGC-AI:\s*/i, "")
    .trim();

  if (!cleanMessage) {
    return { reply: "❓ I received your ping but the message was empty. Try: 🤖 MGC-AI: [your request]" };
  }

  const userMsg = `Request from ${senderName} in ${channel}:
"${cleanMessage}"
Time: ${timestamp}`;

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
      system: MASTER_PROMPT,
      messages: [{ role: "user", content: userMsg }]
    })
  });

  if (!response.ok) throw new Error(`Claude error: ${response.status}`);
  const data = await response.json();
  const reply = data.content[0].text;

  return {
    reply:      reply,
    request:    cleanMessage,
    sender:     senderName,
    channel:    channel,
    timestamp:  timestamp
  };
}

return await runZap();
