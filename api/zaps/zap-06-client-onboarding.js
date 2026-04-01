/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #6 — CLIENT ONBOARDING AUTOMATION                     ║
 * ║  Trigger: Invoice marked "paid" OR new client row in sheet  ║
 * ║  Actions: Claude generates full onboarding kit → Slack      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Google Sheets — Row Updated (status = "Active Client")
 *              OR Zap #5 output where status = "paid"
 * 2. Action 1: Code by Zapier — paste THIS file
 * 3. Action 2: Slack — Post to #mgc-clients
 * 4. Action 3: Gmail — Send welcome email to client
 * 5. Action 4: Gmail — Create draft NDA follow-up
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.clientName       — full name
 *   inputData.clientEmail      — email
 *   inputData.clientPhone      — phone
 *   inputData.clientCompany    — company name
 *   inputData.clientAddress    — address
 *   inputData.serviceEngaged   — which MGC service they purchased
 *   inputData.contractValue    — deal value
 *   inputData.startDate        — engagement start date
 *   inputData.assignedTo       — team member assigned (default: Mark)
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const SYSTEM_PROMPT = `You are the client onboarding intelligence agent for MGC Global Consulting LLC ("Making Global Connections"), Mark G. Cartwright, CEO.

MGC CONTACT: mark@mgcglobalconsulting.com | 410.952.2846 | www.mgcglobalconsulting.com | 101 W. Lombard St., Baltimore, MD 21202

Produce JSON only (no markdown, no preamble):
{
  "welcomeEmail": "Warm, professional welcome email from Mark to the new client. Acknowledge their investment, set expectations for the engagement, outline first 3 steps they need to take, and express genuine excitement about the work ahead.",
  "onboardingChecklist": "Formatted checklist of 8-10 onboarding tasks with owner (Mark vs Client) and suggested timeline for each",
  "ndaReminder": "Brief email reminding client to sign/return the NDA if not yet signed. Reference the MGC standard NDA terms.",
  "intakeQuestions": "10 discovery questions tailored to their specific service engagement — what Mark needs to know to begin",
  "slackCard": "Formatted Slack card for #mgc-clients announcing the new client with key details and first actions",
  "successMetrics": "3-5 KPIs MGC will use to measure success for this engagement"
}`;

async function runZap() {
  const {
    clientName = "New Client",
    clientEmail = "",
    clientPhone = "",
    clientCompany = "",
    clientAddress = "",
    serviceEngaged = "Consulting",
    contractValue = "0",
    startDate = new Date().toLocaleDateString(),
    assignedTo = "Mark G. Cartwright",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  const userMsg = `New client onboarding:
Client: ${clientName}
Company: ${clientCompany}
Email: ${clientEmail}
Phone: ${clientPhone}
Address: ${clientAddress}
Service: ${serviceEngaged}
Contract Value: $${contractValue}
Start Date: ${startDate}
Assigned To: ${assignedTo}`;

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
    parsed = { welcomeEmail: raw, onboardingChecklist: "", ndaReminder: "", intakeQuestions: "", slackCard: `🆕 New client: ${clientName}`, successMetrics: "" };
  }

  return {
    welcomeEmail:        parsed.welcomeEmail,
    onboardingChecklist: parsed.onboardingChecklist,
    ndaReminder:         parsed.ndaReminder,
    intakeQuestions:     parsed.intakeQuestions,
    slackCard:           parsed.slackCard,
    successMetrics:      parsed.successMetrics,
    clientName:          clientName,
    clientEmail:         clientEmail,
    service:             serviceEngaged,
    startDate:           startDate
  };
}

return await runZap();
