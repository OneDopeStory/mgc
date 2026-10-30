# Alex — Second Brain Memory Tree

**Built 2026-10-30.** Did not exist before this date — Alex had reference docs (`../reference/`) but no persistent, pillar-organized memory store. This is the tree architecture requested by the owner; see [`second-brain-directive.md`](second-brain-directive.md) for the full ingestion framework it implements.

## Structure

```
memory/
├── README.md                  — this file
├── second-brain-directive.md  — the 9-pillar framework Alex routes captures against
├── decisions-log.md           — append-only; what was decided and why
├── meeting-notes/             — pillar 1
├── research/                  — pillar 2
├── web-clippings/raw/         — pillar 3 (unprocessed inbox)
├── daily-notes/                — pillar 4
├── workflows-sops/            — pillar 7
├── concepts/                  — pillar 8
└── session-memory/            — pillar 9
```

Pillar 5 (Project Files / PRDs) has no folder here by design — those stay in their own project root (`nonprofit-intake/`, `tools/`, `emails/`, etc.) so specs don't get duplicated out of version control.

## How this differs from the Claude Code dev-assistant memory

This repo's `CLAUDE.md` and `~/.claude/projects/.../memory/MEMORY.md` are the **development assistant's** memory — about building/maintaining the MGC codebase. This `memory/` tree is **Alex's own** memory — about MGC's business operations, client dealings, and staff routing, scoped to the Alex orchestrator persona. They should stay cross-referenced, not merged: a dev decision (e.g. "which Supabase project is live") belongs in `CLAUDE.md`; a business decision Alex needs to act on (e.g. "never quote prices mid-conversation") belongs in `decisions-log.md` here.

## VPS sync status

The Hostinger VPS (`../vps/`) is meant to eventually run Hermes with access to this same knowledge base. As of 2026-10-30, SSH access to the VPS is still blocked (see root `CLAUDE.md` "Alex Dispatch" item), so nothing has been deployed there. This `memory/` tree is the authoritative local copy; sync to the VPS once access is restored — don't stand up a second, divergent copy on the VPS.

## Open questions (ask the owner before building further)

These were raised by the 2026-10-30 "digest this" request and are **not yet answered**:

1. **"Agentic Human-Like Reasoning response system"** — the owner wants Alex to pull from all stored MGC information and route requests to the correct staff member (Marcus/Elena/Jordan/Julian/David) automatically. The routing *goal* already exists in `../README.md` ("≥95% correct first-route rate"). What's new here is tying that routing to this memory tree as the information source. Needs scoping: what counts as a "request" (chat message, email, Slack DM, phone call?), and what's the trigger to build vs. just document the design?
2. **Grok Voice 3.0 "origins" for 410-339-8375** — nothing in this repo links that number to a Grok Voice account or config. Is there an external dashboard/account (xAI, Twilio/Telnyx/etc.) the owner has that documents this, or is "find the origins" asking this session to search externally? Don't guess a provider or account.
3. **"This is direct communication"** — unclear if this means the preceding message is itself an operating directive to store verbatim (done, see `second-brain-directive.md`), or something else. Treated as the former.
4. **Alex Romero / 410-339-8375** — already recorded as decided in root `CLAUDE.md` ("Naming confirmed 2026-10-27" and "Hotline number changed" items). Not new; no conflict found.
