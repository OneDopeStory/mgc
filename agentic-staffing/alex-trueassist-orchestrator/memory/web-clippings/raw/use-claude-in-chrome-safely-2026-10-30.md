# Web Clipping — Use Claude in Chrome Safely

**Source URL:** https://support.claude.com/en/articles/12902428-use-claude-in-chrome-safely
**Captured:** 2026-10-30
**Pillar:** Web Clippings (`memory/web-clippings/raw/` inbox — not yet promoted/tagged)
**Captured for:** Alex (orchestrator persona) — educational reference on browser-agent safety, relevant since Alex/TrueAssist increasingly acts as a web-facing assistant.

## Clean summary

Anthropic's official safety guidance for the Claude-in-Chrome browser extension. Core points relevant to Alex's own design:

- **Prompt injection is the primary threat** — malicious instructions hidden in web page content can try to manipulate an agent into unintended actions (e.g. hidden text telling it to exfiltrate data). Anthropic layers defenses: model training (refusal of malicious directives), content classifiers screening untrusted page content, granular permissions, site blocklists, and mandatory confirmation for sensitive actions (downloads, data entry). Even with all of this, "the risk is not zero" — novel attacks can emerge.
- **Screenshots = full visibility.** The agent captures whatever is visibly on-screen as context. Anything sensitive visible in a tab becomes part of the conversation. Recommended mitigation: separate browser profiles for sensitive accounts, avoid invoking the agent on sensitive pages at all.
- **Regulated data (HIPAA, financial, legal, medical) should not be run through a browser agent** unless explicitly covered by a business agreement — and even then, it's discouraged.
- **Hard blocks:** no stock trading/investment transactions, no CAPTCHA bypass, no sensitive data entry, no facial-image scraping, no adult/pirated content sites.
- **User/operator stays accountable** for everything the agent does in-browser — published content, purchases, data changes, site ToS compliance.
- **Practical safety habits:** start with trusted sites, understand "automatically approve" vs. "manually approve" action modes, stop immediately if the agent goes off-task or asks for unexpected sensitive info, report issues.

## Why this matters for Alex specifically

Alex is MGC's orchestrator persona and is intended (per `second-brain-directive.md` and the call-routing scoping doc) to eventually read from `cloud.md`/`agentic-staffing/`, handle live calls/messages, and relay across Slack/Telegram/WhatsApp. None of that is a *browser* agent today, but the same failure mode — trusting instructions embedded in untrusted incoming content (a form submission, an email, a transcribed call, a scraped web page) as if they were the owner's own instructions — is the generalizable lesson here. Treat this as the canonical external reference for "don't let content from an untrusted source act as a command channel," applicable to any future Alex capability that reads external content (web pages, inbound email bodies, voice transcripts) before acting.

## Raw extracted text

# Use Claude in Chrome Safely

## Overview
Claude in Chrome is accessible to all paid plan subscribers (Pro, Max, Team, Enterprise). On Max and Team plans, the side panel operates as a Claude Cowork session, with rollout to Pro plans underway. Enterprise plans use Cowork once admins enable it; otherwise, the classic experience applies.

## Understanding the Risks

### Prompt Injection Attacks
The primary threat involves malicious instructions embedded in web content that could manipulate Claude into unintended actions. For instance, "hidden text instructing Claude to retrieve bank statements" represents this vulnerability. Safety classifiers screen incoming content and evaluate every action before execution, either blocking or pausing suspicious activities for user approval.

**Critical Note:** "The risk is not zero. Novel attacks may emerge" beyond current evaluations, potentially resulting in data loss. Monitor for unexpected behavior and limit sensitive workflows to trusted websites.

### Sensitive Information Visibility
Claude captures screenshots of active tabs to understand page content. "Whatever is visible in one of those tabs is captured in the screenshots and becomes part of the conversation." Users should avoid the extension on sensitive sites and consider separate browser profiles for sensitive accounts. Admins can restrict access via allowlists.

### Regulated Data
HIPAA-enabled organizations have Claude in Chrome disabled by default. Owners must explicitly enable it in Organization settings. "Claude in Chrome is available but not covered under your Business Associate Agreement (BAA)." Use on regulated data pages is discouraged.

## Safety Measures Implemented

- **Model training:** Reinforcement learning teaches Claude to recognize and refuse malicious directives
- **Content classifiers:** Screen untrusted content for injection attempts
- **Granular permissions:** Control Claude's access and capabilities
- **Site blocklists:** Prevent access to high-risk categories
- **Action confirmations:** Required for downloads and sensitive data entry
- **Automatic screening:** Actions checked before execution in "Automatically approve" mode
- **Red teaming:** Continuous security researcher probing

Testing demonstrates "Claude Opus 4.8 demonstrates significantly stronger prompt injection robustness than previous models" with attack success rates below 0.08%.

## Blocked Sites
Claude cannot access:
- Adult content websites
- Known pirated content sites

Financial sites require permission. Report missing categories to security@anthropic.com.

## User Protection Strategies

1. **Start with trusted sites** — avoid unfamiliar or user-generated content platforms
2. **Understand permissions** — default "Automatically approve" mode screens actions; switch to "Manually approve" for full review
3. **Stay alert** — stop tasks immediately if Claude discusses unrelated topics or requests sensitive information
4. **Report issues** — use in-chat feedback to flag concerning behavior

## Safeguarding Personal Data

Claude sees all visible screen content when the side panel opens. "Claude takes screenshots of your active browser tab to understand webpage content."

### Claude Cannot Perform:
- Stock trading or investment transactions
- CAPTCHA bypassing
- Sensitive data input
- Facial image gathering or scraping

**Note:** 1Password integration enables login completion without credential exposure to Claude.

### Recommendations:
- Maintain separate browser profiles lacking sensitive account access
- Review proposed actions before approval
- Begin with simple tasks (research, form-filling)
- Use specific, tailored prompts
- Recognize that sessions save to history and sync across devices

## Activities to Avoid

Do not use Claude in Chrome for:
- Financial account or investment management
- Legal documents or contracts
- Medical or health information
- Work accounts containing sensitive data
- Sites displaying others' personal information

Avoid opening the extension while viewing sensitive information.

## User Responsibility
Users remain accountable for all browser actions performed by Claude, including published content, purchases, data modifications, and compliance with website terms regarding automated access.

## Enterprise Controls
Team and Enterprise admins configure:
- Allowlists and blocklists restricting site access
- Organization-wide feature toggles

Refer to the Claude in Chrome admin controls documentation for administrative guidance.
