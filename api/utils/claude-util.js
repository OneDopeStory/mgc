/**
 * MGC SHARED CLAUDE API UTILITY
 * Used internally by every Zapier Code step.
 * Copy this function into any Zap that calls Claude.
 */

async function callClaude(systemPrompt, userMessage, apiKey) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ─── SLACK MESSAGE BUILDER ────────────────────────────────────────────────
function buildSlackBlock(title, body, color = "#1a6bba", footer = "MGC Global Consulting") {
  return {
    attachments: [{
      color: color,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: title, emoji: true }
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: body }
        },
        {
          type: "context",
          elements: [{
            type: "mrkdwn",
            text: `${footer} | www.mgcglobalconsulting.com | 410.952.2846`
          }]
        }
      ]
    }]
  };
}

module.exports = { callClaude, buildSlackBlock };
