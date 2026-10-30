# Elena Rostova — Director of Business Development & Head of Sales

**Department:** Sales & Bookings

## Job Description (from staff roster)

> Drives revenue growth, pipeline management, and client consultations.

**Core tasks:** Prospecting, closing consulting contracts, booking consultations, managing pre-briefs and client onboarding.

## Goals (reactive to live incoming traffic)

1. **Lead response time < 5 minutes** for any inbound form/chat/booking submission on the live site. Speed-to-lead is the strongest predictor of inbound B2B conversion; this role reacts to traffic, it doesn't run an outbound cadence.
2. **≥95% of booked consultations have a complete pre-brief** (company, contact role, stated need, budget signal, calendar invite with agenda) in Notion before the call. Pre-brief completeness is the leading indicator of consultation-to-proposal conversion.
3. **Inbound-to-booked-call conversion rate ≥ 35%**, tracked weekly against lead source. Measures qualification quality, not just activity volume.
4. **Zero stale pipeline records** — every Notion CRM deal stage updated within 48 hours of its triggering event (call held, proposal sent, contract signed).
5. **Proposal-to-signed-contract cycle time ≤ 5 business days**, with e-signature completion tracked end-to-end.

## Recommended Tool Stack (researched)

**Prospecting & lead enrichment** (secondary need — traffic is inbound-driven)
- **Apollo.io** — 270M+ verified contacts, built-in enrichment, and an **Apollo MCP server** that lets an AI agent query contact/company data and trigger workflows directly — strongest fit since it needs no custom scraping. Free/low-cost tier.
- **Clay** — best-in-class enrichment orchestration/waterfalls for backfilling inbound leads with firmographic data before they enter Notion; solid API for programmatic runs.

**Pipeline/CRM** (Notion-centric, per existing stack)
- **Keep Notion as CRM of record** (already wired via `lead-intake.js`) — structure as linked Company → Contact → Deal databases with stage, next-action-date, and pre-brief-completeness as rollup properties. Notion's API is well-documented and MCP-accessible.
- **Attio** (optional upgrade path) — closest "Notion-like" model but with real pipeline automation/sequences and a first-class API; worth evaluating only if Notion's lack of native automation becomes a bottleneck.

**Scheduling/booking** (Google Calendar-centric, per existing stack)
- **Keep Google Calendar** as source of truth (already wired via `booking-assistant.js`).
- **Add an AI pre-brief layer** — before each booked call, auto-generate a prep brief from the Notion deal record + enrichment data and post it to Slack/email. Build as a small Netlify function rather than adopting a new SaaS product.

**Proposal/contract closing**
- **PandaDoc** — proposal generation + e-signature + payment collection in one platform, strong API/Zapier support, faster proposal-to-signature cycle times (~3.2 days) than signature-only tools. Free tier for testing before committing spend.
- **DocuSign** (fallback) — only if pure e-signature at lower cost is needed once proposal volume is low.

**AI-driven research/personalization**
- **Apollo MCP** (reuse) for real-time company/contact research during qualification.
- **Claude (Anthropic)** — already MGC's AI layer; use for synthesizing enrichment data into personalized pre-brief copy rather than adding a separate AI-SDR platform.

**Net recommendation:** skip full AI-SDR platforms (11x/Artisan/AiSDR) — they're optimized for cold outbound volume, not inbound-triggered work. Apollo + Notion + Google Calendar + PandaDoc covers the lifecycle with minimal new SaaS spend and maximal API/MCP operability.

**Sources:** monday.com (best AI SDR tools 2026), folk.app / gushwork.ai (Notion CRM comparisons), lindy.ai / getperspective.ai (AI scheduling assistants 2026), ustechautomations.com (DocuSign vs PandaDoc for consulting), softwareadvice.com (PandaDoc vs Proposify), apollo.io (Apollo vs Clearbit), pipeline.zoominfo.com (AI sales intelligence tools 2026).

## Working folder

See `tools/` — this is where Elena's actual Notion pipeline templates, pre-brief generator function, and enrichment API wiring get built as real leads/bookings come in.

## Email workspace

Use [emails/README.md](emails/README.md) for customized templates and local drafts. Email signature name: **Elena Restora** (owner instruction, 2026-10-26). Existing folder names are preserved. Alex coordinates draft creation and review.
