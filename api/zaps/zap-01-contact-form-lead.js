/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #1 — CONTACT FORM LEAD CAPTURE                        ║
 * ║  Trigger: New form submission (Typeform/Gravity/WPForms)    ║
 * ║  Actions: Claude drafts reply → Slack alert → Gmail draft  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Your form tool (Typeform / Gravity Forms / WPForms)
 * 2. Action 1: Code by Zapier (JavaScript) — paste THIS file
 * 3. Action 2: Slack — Send Channel Message → #mgc-leads
 * 4. Action 3: Gmail — Create Draft (use output.emailDraft)
 *
 * ZAPIER INPUT VARIABLES (map from your form fields):
 *   inputData.firstName    — respondent first name
 *   inputData.lastName     — respondent last name
 *   inputData.email        — respondent email
 *   inputData.phone        — respondent phone
 *   inputData.company      — respondent company name
 *   inputData.service      — service they're interested in
 *   inputData.message      — their message / question
 *   inputData.CLAUDE_KEY   — your Claude API key (store as Zapier secret)
 */

const SYSTEM_PROMPT = `You are an elite autonomous AI agent for MGC Global Consulting LLC ("Making Global Connections"), founded by Mark G. Cartwright, CEO.

MGC SERVICES: AI Consulting & Strategy, Automation Architecture, CRM & Pipeline Optimization, Operational Systems Design, AI Education & Workshops, Retainer & Implementation.

CONTACT: mark@mgcglobalconsulting.com | 410.952.2846 | www.mgcglobalconsulting.com

Your task: Given a new inbound lead, produce three outputs in JSON format only (no markdown, no preamble):
{
  "slackSummary": "A concise Slack-formatted summary of the lead with key details and urgency level (🔴 HIGH / 🟡 MEDIUM / 🟢 LOW)",
  "emailDraft": "A professional, personalized email reply from Mark Cartwright acknowledging their inquiry, showing knowledge of their specific service interest, and inviting them to book a free strategy call at https://calendly.com/mark-mgcglobalconsulting/30min",
  "nextMoves": "3 bullet points of recommended next actions for Mark",
  "leadScore": "A score 1-10 with one-sentence rationale"
}`;

async function runZap() {
  const {
    firstName = "there",
    lastName = "",
    email = "",
    phone = "",
    company = "",
    service = "General Inquiry",
    message = "",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY in Zapier secrets");

  const userMsg = `New lead submission:
Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone}
Company: ${company}
Interested Service: ${service}
Message: "${message}"
Received: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`;

  // ── Call Claude ──────────────────────────────────────────────
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
    parsed = {
      slackSummary: raw,
      emailDraft: "Please review Claude's raw response above.",
      nextMoves: "Check Slack for details.",
      leadScore: "N/A"
    };
  }

  return {
    slackMessage:  parsed.slackSummary,
    emailDraft:    parsed.emailDraft,
    nextMoves:     parsed.nextMoves,
    leadScore:     parsed.leadScore,
    leadName:      `${firstName} ${lastName}`.trim(),
    leadEmail:     email,
    leadService:   service,
    timestamp:     new Date().toISOString()
  };
}

return await runZap();
