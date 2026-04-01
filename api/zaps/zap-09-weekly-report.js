/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #9 — WEEKLY PERFORMANCE REPORT (Friday 4PM)           ║
 * ║  Trigger: Schedule — Every Friday at 4:00 PM EST            ║
 * ║  Actions: Claude generates full week report → Slack + Email  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Schedule by Zapier → Every week → Friday → 4:00 PM
 * 2. Action 1: Google Sheets — Get many rows (week's activity log)
 * 3. Action 2: Code by Zapier — paste THIS file
 * 4. Action 3: Slack — Post to #mgc-internal
 * 5. Action 4: Gmail — Send summary to mark@mgcglobalconsulting.com
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.leadsThisWeek    — total new leads
 *   inputData.bookingsThisWeek — total Calendly bookings
 *   inputData.proposalsSent    — proposals/NDAs sent
 *   inputData.dealsWon         — deals closed
 *   inputData.revenueThisWeek  — revenue collected
 *   inputData.activeClients    — number of active clients
 *   inputData.tasksCompleted   — tasks completed
 *   inputData.highlights       — any notable wins/events (free text)
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const SYSTEM_PROMPT = `You are the weekly performance intelligence system for MGC Global Consulting LLC ("Making Global Connections"), Mark G. Cartwright, CEO.

Generate a comprehensive weekly business performance report. Tone: executive board-level summary — data-driven, insight-rich, forward-looking.

Produce JSON only (no markdown, no preamble):
{
  "executiveSummary": "3-4 sentence week-in-review executive summary",
  "performanceScorecard": "Formatted scorecard with all metrics and trend indicators (↑↓→)",
  "winsOfTheWeek": "Top 3 wins from this week — specific and celebratory",
  "gapsIdentified": "2-3 gaps or missed opportunities observed in the data",
  "nextWeekFocus": "Top 5 priorities for next week with rationale",
  "revenueAnalysis": "Brief analysis of revenue activity and pipeline health",
  "strategicInsight": "One high-value strategic observation Mark should act on",
  "slackMessage": "Full formatted Slack version of the weekly report"
}`;

async function runZap() {
  const {
    leadsThisWeek    = "0",
    bookingsThisWeek = "0",
    proposalsSent    = "0",
    dealsWon         = "0",
    revenueThisWeek  = "0",
    activeClients    = "0",
    tasksCompleted   = "0",
    highlights       = "None noted",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  const weekEnding = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const userMsg = `Weekly performance data for week ending ${weekEnding}:

New Leads: ${leadsThisWeek}
Calendly Bookings: ${bookingsThisWeek}
Proposals/NDAs Sent: ${proposalsSent}
Deals Won: ${dealsWon}
Revenue Collected: $${revenueThisWeek}
Active Clients: ${activeClients}
Tasks Completed: ${tasksCompleted}
Notable Highlights: ${highlights}`;

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
    parsed = { executiveSummary: raw, slackMessage: raw, performanceScorecard: "", winsOfTheWeek: "", gapsIdentified: "", nextWeekFocus: "", revenueAnalysis: "", strategicInsight: "" };
  }

  return {
    slackMessage:       parsed.slackMessage,
    executiveSummary:   parsed.executiveSummary,
    scorecard:          parsed.performanceScorecard,
    wins:               parsed.winsOfTheWeek,
    gaps:               parsed.gapsIdentified,
    nextWeekPriorities: parsed.nextWeekFocus,
    revenueAnalysis:    parsed.revenueAnalysis,
    strategicInsight:   parsed.strategicInsight,
    weekEnding:         weekEnding
  };
}

return await runZap();
