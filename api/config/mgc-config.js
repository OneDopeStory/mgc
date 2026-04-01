/**
 * MGC GLOBAL CONSULTING — MASTER CONFIGURATION
 * www.mgcglobalconsulting.com
 * All Zapier automation settings in one place.
 * Update values here; all Zaps inherit them automatically.
 */

module.exports = {

  // ─── COMPANY IDENTITY ────────────────────────────────────────────────────
  company: {
    name: "MGC Global Consulting LLC",
    tagline: "Making Global Connections",
    ceo: "Mark G. Cartwright",
    email: "mark@mgcglobalconsulting.com",
    phone: "410.952.2846",
    address: "101 W. Lombard St., Baltimore, MD 21202",
    website: "https://www.mgcglobalconsulting.com",
    calendly: "https://calendly.com/mark-mgcglobalconsulting/30min",
    bankAccount: "Capital One — A/c: #36059083952 (Mark Cartwright)"
  },

  // ─── SLACK CHANNELS ──────────────────────────────────────────────────────
  slack: {
    aiHub:        "#mgc-ai-hub",
    dailyBrief:   "#mgc-daily-briefing",
    leads:        "#mgc-leads",
    clients:      "#mgc-clients",
    finance:      "#mgc-finance",
    ops:          "#mgc-operations",
    bookings:     "#mgc-bookings",
    membership:   "#mgc-membership",
    alerts:       "#mgc-alerts",
    recycle4life: "#recycle4life-ops",
  },

  // ─── CLAUDE API ──────────────────────────────────────────────────────────
  claude: {
    apiUrl: "https://api.anthropic.com/v1/messages",
    model:  "claude-sonnet-4-20250514",
    maxTokens: 1000,
    // API key stored as Zapier secret: CLAUDE_API_KEY
  },

  // ─── SERVICE TYPES (maps to site pages) ─────────────────────────────────
  services: {
    "ai-consulting":    "AI Consulting & Strategy",
    "automation":       "Automation Architecture",
    "crm-optimization": "CRM & Pipeline Optimization",
    "systems-design":   "Operational Systems Design",
    "ai-workshops":     "AI Education & Workshops",
    "retainer-support": "Retainer & Implementation",
    "membership":       "MGC Membership",
    "true-assist":      "True Assist Program",
  },

  // ─── MASTER AGENTIC SYSTEM PROMPT ────────────────────────────────────────
  masterPrompt: `You are an elite autonomous AI agent and Chief Operations Architect for MGC Global Consulting LLC ("Making Global Connections"), founded by Mark G. Cartwright, CEO.

COMPANY: MGC Global Consulting LLC | 101 W. Lombard St., Baltimore, MD 21202
WEBSITE: www.mgcglobalconsulting.com | EMAIL: mark@mgcglobalconsulting.com | PHONE: 410.952.2846
SERVICES: AI Consulting & Strategy, Automation Architecture, CRM Optimization, Operational Systems Design, AI Education & Workshops, Retainer & Implementation

AUTONOMY DIRECTIVES:
1. THINK IN SYSTEMS — Address root cause + downstream effects, never isolated tasks
2. EXECUTE BEFORE EXPLAINING — Deliver finished output first, reasoning after if asked
3. ANTICIPATE THE NEXT 3 MOVES — After every task, surface the next 3 logical actions
4. FILL THE GAPS — Make intelligent assumptions if info is missing; flag them at the end
5. SELF-CORRECT IN REAL TIME — Pivot immediately if you detect a better approach
6. CROSS-DOMAIN EXECUTION — Legal, automation, CRM, marketing, client comms — handle all

TONE: Executive-level. Direct. Solutions-first. No fluff.

OUTPUT FORMAT:
✅ ACTION TAKEN: [What was done]
📋 OUTPUT: [Full content]
⚠️ ASSUMPTIONS: [Any gaps filled]
🔜 NEXT 3 MOVES: [Proactive recommendations for Mark]`
};
