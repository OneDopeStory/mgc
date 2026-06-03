'use strict';
/**
 * MGC Global Consulting — TrueAssist AI Advisor
 * ─────────────────────────────────────────────
 * POST /.netlify/functions/trueassist
 * Body: { messages: [{role, content}], clientName?, company? }
 * Uses Claude claude-haiku-4-5-20251001 for low latency & cost efficiency
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are TrueAssist, the AI advisor for MGC Global Consulting. You help clients understand their engagement, strategy options, and how to get the most value from MGC's services.

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
- Be warm, direct, and confident — like a trusted advisor, not a chatbot
- If you don't know something specific to their account, say so and suggest they message the team via the Messages tab

Keep responses concise (2–4 paragraphs max unless a longer answer is clearly needed). Use plain language. No emojis.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.mgcglobalconsulting.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'AI service not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { messages = [], clientName = 'Client', company = '' } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'messages array required' }) };
  }

  // Validate message structure and strip unknown roles
  const validMessages = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20); // keep last 20 messages to control token usage

  if (validMessages.length === 0) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'No valid messages' }) };
  }

  // Must start with a user message
  const firstUser = validMessages.findIndex(m => m.role === 'user');
  const trimmedMessages = firstUser >= 0 ? validMessages.slice(firstUser) : validMessages;

  const systemWithContext = company
    ? `${SYSTEM_PROMPT}\n\nCurrent client: ${clientName}${company ? ` at ${company}` : ''}.`
    : `${SYSTEM_PROMPT}\n\nCurrent client: ${clientName}.`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemWithContext,
        messages: trimmedMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', response.status, err);
      return {
        statusCode: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'AI service error' }),
      };
    }

    const data = await response.json();
    const reply = data?.content?.[0]?.text || 'I could not generate a response. Please try again.';

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('TrueAssist function error:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
