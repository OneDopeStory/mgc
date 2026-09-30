"use strict";

// netlify/functions/trueassist.js
var ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
var MODEL = "claude-haiku-4-5-20251001";
var MAX_TOKENS = 1024;
var SYSTEM_PROMPT = `You are TrueAssist, the AI advisor for MGC Global Consulting. You help clients understand their engagement, strategy options, and how to get the most value from MGC's services.

MGC Global Consulting specializes in:
- AI Strategy & Implementation (custom AI roadmaps, LLM integrations, AI readiness assessments)
- Business Automation (workflow automation, n8n/Zapier, process optimization)
- CRM Optimization (HubSpot, Salesforce, Notion, pipeline design)
- Systems Architecture & Design
- Retainer Support & Partner Success programs

Your role:
- Answer questions about their MGC engagement, project status, next steps
- Help clients think through automation opportunities and AI use cases
- Provide strategic guidance grounded in practical business outcomes
- Be warm, direct, and confident \u2014 like a trusted advisor, not a chatbot
- If you don't know something specific to their account, say so and suggest they message the team via the Messages tab

Keep responses concise (2\u20134 paragraphs max unless a longer answer is clearly needed). Use plain language. No emojis.`;
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://www.mgcglobalconsulting.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: "AI service not configured" }) };
  }
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Invalid JSON" }) };
  }
  const { messages = [], clientName = "Client", company = "" } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "messages array required" }) };
  }
  const validMessages = messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-20);
  if (validMessages.length === 0) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "No valid messages" }) };
  }
  const firstUser = validMessages.findIndex((m) => m.role === "user");
  const trimmedMessages = firstUser >= 0 ? validMessages.slice(firstUser) : validMessages;
  const systemWithContext = company ? `${SYSTEM_PROMPT}

Current client: ${clientName}${company ? ` at ${company}` : ""}.` : `${SYSTEM_PROMPT}

Current client: ${clientName}.`;
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemWithContext,
        messages: trimmedMessages
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", response.status, err);
      return {
        statusCode: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "AI service error" })
      };
    }
    const data = await response.json();
    const reply = data?.content?.[0]?.text || "I could not generate a response. Please try again.";
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error("TrueAssist function error:", err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
//# sourceMappingURL=trueassist.js.map
