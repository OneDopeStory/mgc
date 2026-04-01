/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #10 — MEMBERSHIP SIGNUP HANDLER                       ║
 * ║  Trigger: New membership purchase/signup                    ║
 * ║  Actions: Claude generates welcome kit → Slack → Email      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP:
 * 1. Trigger:  Stripe — New Customer (membership purchase)
 *              OR Google Sheets — New row (membership signups)
 *              OR WooCommerce/Memberpress — New membership
 * 2. Action 1: Code by Zapier — paste THIS file
 * 3. Action 2: Slack — Post to #mgc-membership
 * 4. Action 3: Gmail — Send welcome email to new member
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.memberName       — full name
 *   inputData.memberEmail      — email
 *   inputData.memberPhone      — phone
 *   inputData.memberCompany    — company (optional)
 *   inputData.memberTier       — "Starter" / "Professional" / "Enterprise"
 *   inputData.joinDate         — today's date
 *   inputData.referralSource   — how they found MGC
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const SYSTEM_PROMPT = `You are the membership onboarding agent for MGC Global Consulting LLC ("Making Global Connections"), Mark G. Cartwright, CEO.

MGC MEMBERSHIP delivers: access to AI tools, consulting resources, community, workshops, networking, and ongoing strategy support.
CONTACT: mark@mgcglobalconsulting.com | 410.952.2846 | www.mgcglobalconsulting.com

Produce JSON only (no markdown, no preamble):
{
  "welcomeEmail": "Warm, energetic welcome email from Mark to the new member. Celebrate their decision, outline what they get access to immediately, first 3 steps to take, and how to get the most value from membership.",
  "memberPortalGuide": "Quick-start guide: 5 things to do in your first week as an MGC member",
  "personalizedTip": "One specific, personalized tip for this member based on their tier and company/background",
  "slackAnnouncement": "Slack message for #mgc-membership welcoming the new member (public-facing, celebratory)",
  "checkIn30Day": "Draft of the 30-day check-in email to be sent in 30 days to ensure they're getting value"
}`;

async function runZap() {
  const {
    memberName     = "New Member",
    memberEmail    = "",
    memberPhone    = "",
    memberCompany  = "",
    memberTier     = "Professional",
    joinDate       = new Date().toLocaleDateString(),
    referralSource = "website",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  const userMsg = `New MGC membership:
Name: ${memberName}
Email: ${memberEmail}
Phone: ${memberPhone}
Company: ${memberCompany}
Tier: ${memberTier}
Joined: ${joinDate}
Found us via: ${referralSource}`;

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
    parsed = { welcomeEmail: raw, memberPortalGuide: "", personalizedTip: "", slackAnnouncement: `🎉 New member: ${memberName}`, checkIn30Day: "" };
  }

  return {
    welcomeEmail:       parsed.welcomeEmail,
    memberPortalGuide:  parsed.memberPortalGuide,
    personalizedTip:    parsed.personalizedTip,
    slackAnnouncement:  parsed.slackAnnouncement,
    checkIn30Day:       parsed.checkIn30Day,
    memberName:         memberName,
    memberEmail:        memberEmail,
    memberTier:         memberTier,
    joinDate:           joinDate
  };
}

return await runZap();
