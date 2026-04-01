/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #7 — NDA & CONTRACT AUTO-DRAFT                        ║
 * ║  Trigger: New client reaches "proposal" stage in CRM/Sheet  ║
 * ║  Actions: Claude drafts NDA + SOW → Gmail → Slack           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Google Sheets — Row Updated (stage = "Proposal")
 *              OR Zap #4 output for HIGH urgency leads
 * 2. Action 1: Code by Zapier — paste THIS file
 * 3. Action 2: Gmail — Create Draft (NDA summary email with doc link)
 * 4. Action 3: Slack — Post to #mgc-clients
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.clientName       — full name
 *   inputData.clientEmail      — email
 *   inputData.clientCompany    — company/org name
 *   inputData.clientTitle      — their title
 *   inputData.serviceType      — service being proposed
 *   inputData.proposalValue    — proposed contract value
 *   inputData.effectiveDate    — proposed start date
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const SYSTEM_PROMPT = `You are the legal documentation agent for MGC Global Consulting LLC ("Making Global Connections"), Mark G. Cartwright, CEO — Founder.

MGC STANDARD TERMS:
- NDA: 2-year term, 3-year confidentiality survival, governed by Maryland law
- Non-solicitation: 12 months post-termination
- Non-circumvention included
- Payment terms: Due upon receipt, 5% late fee after 7 days
- Governing law: State of Maryland

Produce JSON only (no markdown, no preamble):
{
  "ndaSummaryEmail": "Email to client explaining the NDA in plain English, what it covers, why it protects BOTH parties, and instructions to sign. Warm, not legal-heavy.",
  "sowDraft": "Statement of Work draft. Sections: Scope of Services, Deliverables, Timeline, Investment, Payment Terms, Point of Contact, Acceptance Criteria. Tailored to their specific service type.",
  "proposalEmail": "Professional proposal email from Mark presenting the engagement, value proposition, investment, and next steps",
  "slackCard": "Slack update for #mgc-clients: prospect name, service, deal value, next action required",
  "riskFlags": "Any terms or situations to flag for Mark's attention before sending"
}`;

async function runZap() {
  const {
    clientName = "Prospect",
    clientEmail = "",
    clientCompany = "",
    clientTitle = "Owner",
    serviceType = "Consulting",
    proposalValue = "0",
    effectiveDate = new Date().toLocaleDateString(),
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  const userMsg = `Draft NDA and SOW for:
Client: ${clientName} (${clientTitle})
Company: ${clientCompany}
Email: ${clientEmail}
Service: ${serviceType}
Proposed Value: $${proposalValue}
Effective Date: ${effectiveDate}
MGC Signatory: Mark G. Cartwright, Founder/CEO`;

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
    parsed = { ndaSummaryEmail: raw, sowDraft: "", proposalEmail: "", slackCard: `📄 Proposal: ${clientName}`, riskFlags: "" };
  }

  return {
    ndaSummaryEmail: parsed.ndaSummaryEmail,
    sowDraft:        parsed.sowDraft,
    proposalEmail:   parsed.proposalEmail,
    slackCard:       parsed.slackCard,
    riskFlags:       parsed.riskFlags,
    clientName:      clientName,
    clientEmail:     clientEmail,
    serviceType:     serviceType,
    proposalValue:   proposalValue
  };
}

return await runZap();
