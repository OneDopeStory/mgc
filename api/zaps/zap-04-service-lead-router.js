/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #4 — SERVICE-SPECIFIC LEAD ROUTER                     ║
 * ║  Routes leads to the right Slack channel based on service   ║
 * ║  + generates tailored service-specific follow-up content    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  New lead (same form trigger as Zap #1)
 * 2. Action 1: Code by Zapier — paste THIS file
 * 3. Action 2: Zapier Paths — route to different Slack channels
 *              based on output.targetChannel
 *
 * SERVICES HANDLED:
 *   ai-consulting    → #mgc-ai-consulting
 *   automation       → #mgc-automation
 *   crm-optimization → #mgc-crm
 *   systems-design   → #mgc-systems
 *   ai-workshops     → #mgc-workshops
 *   retainer-support → #mgc-retainer
 *   membership       → #mgc-membership
 *   general          → #mgc-leads
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.service          — service slug or name from form
 *   inputData.name             — lead name
 *   inputData.email            — lead email
 *   inputData.company          — lead company
 *   inputData.message          — their inquiry
 *   inputData.CLAUDE_KEY       — Claude API key
 */

// ── Service routing map ───────────────────────────────────────────────────
const SERVICE_CHANNELS = {
  "ai-consulting":    "#mgc-ai-consulting",
  "ai consulting":   "#mgc-ai-consulting",
  "automation":      "#mgc-automation",
  "crm":             "#mgc-crm",
  "crm-optimization":"#mgc-crm",
  "systems-design":  "#mgc-systems",
  "systems":         "#mgc-systems",
  "ai-workshops":    "#mgc-workshops",
  "workshops":       "#mgc-workshops",
  "retainer":        "#mgc-retainer",
  "retainer-support":"#mgc-retainer",
  "membership":      "#mgc-membership",
  "true-assist":     "#mgc-true-assist",
};

const SERVICE_PROMPTS = {
  "ai-consulting": "Focus on AI readiness, ROI modeling, governance, and implementation roadmap opportunities.",
  "automation": "Focus on workflow gaps, manual process pain points, Zapier/Notion/n8n fit, and integration opportunities.",
  "crm": "Focus on pipeline leakage, lead response time, CRM configuration gaps, and revenue recovery potential.",
  "systems-design": "Focus on operational chaos, tribal knowledge risks, scaling bottlenecks, and SOPs needed.",
  "ai-workshops": "Focus on team AI literacy gaps, executive vs team training needs, and workshop format fit.",
  "retainer": "Focus on ongoing support needs, current pain points, and retainer tier fit.",
  "membership": "Focus on membership tier fit, networking value, and community engagement potential.",
};

const MASTER_SYSTEM = `You are an elite autonomous sales intelligence agent for MGC Global Consulting LLC ("Making Global Connections"), Mark G. Cartwright, CEO.

MGC SERVICES: AI Consulting & Strategy, Automation Architecture, CRM & Pipeline Optimization, Operational Systems Design, AI Education & Workshops, Retainer & Implementation.

Produce JSON only (no markdown, no preamble):
{
  "serviceMatch": "Best MGC service match and why (1-2 sentences)",
  "painPoints": "3 likely pain points this lead has based on their inquiry",
  "proposedValue": "Specific value proposition for THIS lead — not generic",
  "followUpEmail": "Personalized follow-up email draft from Mark, references their specific service interest and pain points, CTA to book at https://calendly.com/mark-mgcglobalconsulting/30min",
  "slackCard": "Brief Slack card summary with lead details, score (1-10), and recommended action",
  "urgency": "HIGH / MEDIUM / LOW with one-sentence reason"
}`;

async function runZap() {
  const {
    service = "general",
    name = "Prospect",
    email = "",
    company = "",
    message = "",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  // Determine channel
  const serviceKey = service.toLowerCase().trim();
  const targetChannel = SERVICE_CHANNELS[serviceKey] || "#mgc-leads";

  // Get service-specific coaching hint
  const hint = Object.entries(SERVICE_PROMPTS)
    .find(([k]) => serviceKey.includes(k))?.[1] || "Focus on their core business challenge and how MGC can solve it.";

  const userMsg = `New lead routing needed:
Name: ${name}
Email: ${email}
Company: ${company}
Interested In: ${service}
Their Message: "${message}"
Service Hint: ${hint}`;

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
      system: MASTER_SYSTEM,
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
    parsed = { serviceMatch: service, painPoints: "", proposedValue: "", followUpEmail: raw, slackCard: raw, urgency: "MEDIUM" };
  }

  return {
    targetChannel:  targetChannel,
    serviceMatch:   parsed.serviceMatch,
    painPoints:     parsed.painPoints,
    proposedValue:  parsed.proposedValue,
    followUpEmail:  parsed.followUpEmail,
    slackCard:      parsed.slackCard,
    urgency:        parsed.urgency,
    leadName:       name,
    leadEmail:      email,
    service:        service
  };
}

return await runZap();
