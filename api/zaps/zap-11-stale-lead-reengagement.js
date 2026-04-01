/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #11 — STALE LEAD RE-ENGAGEMENT                        ║
 * ║  Trigger: Google Sheets — lead hasn't moved in 7+ days      ║
 * ║  Actions: Claude drafts re-engagement email → Slack alert   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Schedule — Daily at 9AM
 * 2. Action 1: Google Sheets — Lookup rows where last_contact > 7 days ago
 * 3. Action 2: Code by Zapier — paste THIS file (loop if multiple rows)
 * 4. Action 3: Slack — Post to #mgc-leads with stale lead list
 * 5. Action 4: Gmail — Create draft re-engagement email
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.leadName         — lead full name
 *   inputData.leadEmail        — lead email
 *   inputData.leadCompany      — company
 *   inputData.serviceInterest  — what they inquired about
 *   inputData.lastContact      — last contact date
 *   inputData.daysSinceContact — number of days since last touch
 *   inputData.previousContext  — summary of previous conversation
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const SYSTEM_PROMPT = `You are the lead re-engagement agent for MGC Global Consulting LLC ("Making Global Connections"), Mark G. Cartwright, CEO.

MGC helps organizations: streamline operations, automate workflows, optimize CRMs, design systems, and adopt AI responsibly.
CALENDLY: https://calendly.com/mark-mgcglobalconsulting/30min
CONTACT: mark@mgcglobalconsulting.com | 410.952.2846

Produce JSON only (no markdown, no preamble):
{
  "reEngagementEmail": "A non-pushy, value-first re-engagement email from Mark. Reference their original inquiry, offer something new/relevant (a tip, insight, or resource), and softly invite them to reconnect. NOT salesy — genuinely helpful.",
  "slackAlert": "Slack alert for #mgc-leads: lead name, days stale, service interest, recommended action",
  "alternativeApproach": "If email doesn't work, what's one other creative re-engagement tactic for this specific lead?",
  "shouldPurge": "true or false — should this lead be archived? Rationale in one sentence.",
  "urgencyNote": "Any reason this lead should be escalated to Mark's personal attention?"
}`;

async function runZap() {
  const {
    leadName          = "Lead",
    leadEmail         = "",
    leadCompany       = "",
    serviceInterest   = "Consulting",
    lastContact       = "",
    daysSinceContact  = "7",
    previousContext   = "Inquired about services",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  const userMsg = `Stale lead re-engagement needed:
Name: ${leadName}
Email: ${leadEmail}
Company: ${leadCompany}
Interested In: ${serviceInterest}
Last Contact: ${lastContact}
Days Since Contact: ${daysSinceContact}
Previous Context: "${previousContext}"`;

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
    parsed = { reEngagementEmail: raw, slackAlert: `⏰ Stale: ${leadName} (${daysSinceContact}d)`, alternativeApproach: "", shouldPurge: "false", urgencyNote: "" };
  }

  return {
    reEngagementEmail:   parsed.reEngagementEmail,
    slackAlert:          parsed.slackAlert,
    alternativeApproach: parsed.alternativeApproach,
    shouldPurge:         parsed.shouldPurge,
    urgencyNote:         parsed.urgencyNote,
    leadName:            leadName,
    leadEmail:           leadEmail,
    daysSinceContact:    daysSinceContact
  };
}

return await runZap();
