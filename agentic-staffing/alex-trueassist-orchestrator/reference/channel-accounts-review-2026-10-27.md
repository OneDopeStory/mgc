# Channel-account screenshot review — 2026-10-27

Fulfills the pending screenshot-review task named in [COMMUNICATIONS-FOLLOW-UP.md](../COMMUNICATIONS-FOLLOW-UP.md) and [CLOUD-CONNECTIVITY-AND-FEEDBACK.md](../CLOUD-CONNECTIVITY-AND-FEEDBACK.md#screenshot-review-and-next-slice). Six screenshots supplied by the owner, reviewed for application/page, hostname, theme, existing connections, data ownership, and intended action. Documentation only — no account was connected, no credential was configured, and no message was sent as part of this review.

## Security note — read first

Screenshot 3 (Telegram BotFather) showed a live, unredacted HTTP API token for the newly created bot `@mgcglobalbot`. A bot token is a full bearer credential for that bot — holding it is equivalent to holding its password. Because it was shared in a chat/image context, treat it as exposed regardless of how it is used going forward.

**Required before this bot is used for anything:**
1. In Telegram, message `@BotFather` → `/mybots` → `@mgcglobalbot` → **API Token** → **Revoke current token**, which issues a new one.
2. Store the new token only in a secret manager the Hermes VPS or Netlify environment reads at runtime (`BOOKING_*`/`SLACK_*`-style env var convention already used in this repo) — never in a file in this repository, this `agentic-staffing/` tree, or any committed doc.
3. This file intentionally does not reproduce the original or any future token.

## Screenshot-by-screenshot record

### 1. WhatsApp — username reserved
- **Application:** WhatsApp (iOS), native "username" feature (pre-release at capture time — "We'll let you know when your username is ready to use").
- **Handle:** `@mgcglobal`, reserved under the owner's existing WhatsApp account/number.
- **Ownership:** Owner's personal/business WhatsApp number — not a new account.
- **Connections:** None yet; this is a reservation, not an active integration.
- **Relevance:** Future-facing identifier for MGC's WhatsApp presence once WhatsApp activates username sharing; not itself a channel-adapter decision.

### 2. zernio.com — onboarding wizard
- **Application/hostname:** `zernio.com`, logged in (avatar "M" visible), mid onboarding wizard.
- **What it is:** Commercial omnichannel messaging platform — unified inbox across WhatsApp Business API, SMS, RCS, iMessage, social, and voice calls, usable from its dashboard, a REST API, or directly by an MCP-connected AI agent (Claude/ChatGPT/custom agents). ([Zernio](https://www.producthunt.com/products/zernio), [Zernio WhatsApp API](https://zernio.com/whatsapp))
- **Connections:** None completed in the screenshot — step 2 of the wizard ("Connect your first account or number") was not finished; "Skip setup" was visible.
- **Ownership:** New account, not yet tied to any MGC number or social account.
- **Relevance:** A candidate replacement for the hand-built WhatsApp/SMS/voice channel-adapter layer described in `CLOUD-CONNECTIVITY-AND-FEEDBACK.md`'s connection map (the `CHANNELS → IN` box). **Not adopted by this review** — recorded as an open option against the existing DIY path (Hostinger/Hermes + Telegram Bot API + WhatsApp Business Cloud API, per [hermes-agent.md](hermes-agent.md)). Trade-off to weigh before deciding: one hosted subscription + less custom code vs. an added third-party dependency and recurring cost outside the current Netlify/Supabase/Hermes stack.

### 3. Telegram — BotFather bot creation
- **Application:** Telegram, `@BotFather` conversation.
- **Bot created:** `@mgcglobalbot`, live at `t.me/mgcglobalbot`.
- **Credential:** HTTP API token issued — **see Security note above; not reproduced here.**
- **Ownership:** Created under the owner's personal Telegram account.
- **Relevance:** This is the concrete Telegram Bot API integration point `project_portals_and_system_map.md` and `hermes-agent.md` already planned for — a bot identity now exists, but it is not yet wired to Hermes, has no webhook/polling configured, and (per the security note) its current token must not be used until rotated.

### 4. Telegram — idbot lookup
- **Application:** Telegram, `@idbot` ("User Info • Get ID") conversation, `/start`.
- **Result:** Owner's personal Telegram identity — numeric user ID `8602350239`, first/last name Mark Cartwright, language `en`.
- **Ownership:** Owner's own account; no third party's data was queried.
- **Relevance:** This numeric ID is the "owner chat ID" the [cloud handoff](../CLOUD-CONNECTIVITY-AND-FEEDBACK.md) and [`emails/AUTOMATION.md`](../emails/AUTOMATION.md) (step 6 of the draft workflow) describe as the destination for private owner-only Telegram notifications once Hermes is wired up. Treat it as routing configuration, not a secret, but still keep it in env/config rather than public docs.

### 5. Telegram — Premium/Business purchase
- **Application:** Telegram, Settings → Telegram Business, annual plan purchase confirmed ("Your purchase was successful").
- **Ownership:** Owner's personal Telegram account (the same account `@mgcglobalbot` was created under and `idbot` identified) — distinct from the bot.
- **Unlocked features visible:** Opening hours, Quick Replies, Greeting Messages (Away Messages partially visible below the fold).
- **Relevance:** Business features apply to the owner's own Telegram account, not to `@mgcglobalbot`. This is a second, separate Telegram presence option (a "business page" on the owner's real account) alongside the bot — worth distinguishing in any future routing design, since they have different capabilities and different audiences (DM-to-owner vs. bot-driven automation).

### 6. "Second brain" reference slide
- **Not an account/credential.** A PKM/notes-app marketing slide the owner saved, listing 9 save-to-second-brain categories: Meeting Notes, Research Summaries, Web Clippings, Daily Notes/Journal, Project Files/PRDs, Decisions Log, Workflows/SOPs, Concept/Synthesis Pages, Session Memory.
- **Relevance — mapping to this project's existing structure** (so nothing new needs to be invented to satisfy it):

| Second-brain category | Existing home in this project |
|---|---|
| Decisions Log | "Current state & open items" in root `CLAUDE.md` |
| Session Memory | Cross-session `MEMORY.md` index + per-topic memory files |
| Workflows/SOPs | `AUTOMATION.md`, `AGENTS.md` files, role `README.md`s under `agentic-staffing/` |
| Project files/PRDs | `docs/` (e.g. `docs/command-center.md`, `docs/trueassist-architecture.md`) |
| Research Summaries | `docs/reference/` archives, `reference/` folders like this one |
| Meeting Notes / Daily Notes / Web Clippings / Concept pages | No dedicated home yet — if the owner wants these captured going forward, the natural fit is new dated files under `docs/reference/` or a `notes/` folder, same convention as this file |

## Open items for the owner

- [ ] Rotate the `@mgcglobalbot` token (see Security note) before any further bot work.
- [ ] Decide: Zernio (hosted, paid) vs. the existing DIY Hermes + Telegram Bot API + WhatsApp Business Cloud API plan — or both, for different channels.
- [ ] Confirm whether `@mgcglobal` (WhatsApp) and `@mgcglobalbot` (Telegram) are the permanent handles to standardize on across channels.
- [ ] Confirm whether meeting notes / daily notes / web clippings should get a dedicated folder, or stay ad hoc.
