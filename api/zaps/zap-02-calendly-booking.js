/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #2 — CALENDLY BOOKING INTELLIGENCE                    ║
 * ║  Trigger: New Calendly booking (strategy call booked)       ║
 * ║  Actions: Claude prepares intake brief → Slack → Gmail      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Calendly — Invitee Created
 * 2. Action 1: Code by Zapier (JavaScript) — paste THIS file
 * 3. Action 2: Slack — Post to #mgc-bookings
 * 4. Action 3: Gmail — Send Email (confirmation to client)
 * 5. Action 4: Gmail — Create Draft (prep brief for Mark)
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.inviteeName      — booker full name
 *   inputData.inviteeEmail     — booker email
 *   inputData.eventStart       — meeting start time (ISO)
 *   inputData.eventEnd         — meeting end time (ISO)
 *   inputData.eventType        — calendly event name
 *   inputData.answers          — answers to calendly questions (JSON string or plain text)
 *   inputData.cancelUrl        — cancellation URL
 *   inputData.rescheduleUrl    — reschedule URL
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const SYSTEM_PROMPT = `You are the pre-meeting intelligence system for MGC Global Consulting LLC, founded by Mark G. Cartwright, CEO.

MGC SERVICES: AI Consulting & Strategy, Automation Architecture, CRM & Pipeline Optimization, Operational Systems Design, AI Education & Workshops, Retainer & Implementation.
WEBSITE: www.mgcglobalconsulting.com

Your task: Given a new Calendly booking, produce JSON only (no markdown, no preamble):
{
  "slackAlert": "Formatted Slack message announcing the booking with all key details",
  "clientConfirmation": "Warm, professional confirmation email to the client from Mark Cartwright. Include meeting details, what to expect, and a 'come prepared' checklist based on their stated interest.",
  "markBrief": "Pre-meeting intelligence brief for Mark. Include: likely client pain points based on their answers, 3 discovery questions to ask, suggested service fit, red flags to watch for, and deal potential estimate.",
  "meetingAgenda": "Suggested 30-minute agenda with time blocks"
}`;

async function runZap() {
  const {
    inviteeName = "Client",
    inviteeEmail = "",
    eventStart = "",
    eventEnd = "",
    eventType = "Strategy Call",
    answers = "",
    cancelUrl = "",
    rescheduleUrl = "",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  const startFormatted = eventStart
    ? new Date(eventStart).toLocaleString("en-US", {
        timeZone: "America/New_York",
        weekday: "long", year: "numeric", month: "long",
        day: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : "TBD";

  const userMsg = `New Calendly booking:
Client: ${inviteeName}
Email: ${inviteeEmail}
Meeting: ${eventType}
Time: ${startFormatted} EST
Their answers/notes: "${answers}"
Cancel: ${cancelUrl}
Reschedule: ${rescheduleUrl}`;

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
      slackAlert: `📅 New booking: ${inviteeName} — ${startFormatted}`,
      clientConfirmation: raw,
      markBrief: "See Claude raw response.",
      meetingAgenda: "Review manually."
    };
  }

  return {
    slackAlert:           parsed.slackAlert,
    clientConfirmation:   parsed.clientConfirmation,
    markBrief:            parsed.markBrief,
    meetingAgenda:        parsed.meetingAgenda,
    clientName:           inviteeName,
    clientEmail:          inviteeEmail,
    meetingTime:          startFormatted,
    meetingType:          eventType
  };
}

return await runZap();
