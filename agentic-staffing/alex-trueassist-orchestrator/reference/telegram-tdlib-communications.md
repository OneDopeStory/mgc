# Telegram TDLib reference for TrueAssist communications

Reviewed: 2026-10-27. Purpose: an on-demand reference for Codex agents working on Alex/TrueAssist and incoming client, potential customer, or partnership conversations. Status: documentation only; no account connection, deployment, database migration, or message delivery performed.

## What the supplied link establishes

TDLib (Telegram Database Library) is an open-source Telegram client library. It handles Telegram networking, encryption, local storage, and ordered asynchronous updates. It supports multiple platforms and language interfaces, including JSON for integration with other languages. Telegram describes local data encryption with a user-provided key. This is Telegram client infrastructure, not a general database of customers or a connector to other messaging services. [Telegram TDLib overview](https://core.telegram.org/tdlib)

The library has native build dependencies, including a C++17 compiler, OpenSSL, zlib, and CMake. Choose and pin a compatible release and binding before implementation. Consult the maintained interface documentation and examples instead of copying an unverified wrapper signature. [Library documentation and build guidance](https://core.telegram.org/tdlib/docs/)

## How a future agent should retrieve Telegram context

1. Identify the authorized Telegram account, permitted chat, and corresponding MGC conversation. Do not search unrelated chats or treat Telegram membership as proof of client identity.
2. Use the TDLib authorization-state flow. Initialization includes application credentials (`api_id`, `api_hash`) and a writable database directory. Only make ordinary requests once authorization reaches the ready state.
3. Consume updates in their received order. For the JSON interface, match responses to requests using `@extra`.
4. Retrieve scoped history through `getChatHistory`, paginating from message IDs. Results can be smaller than the requested limit; preserve chat ID with message ID because message identifiers are scoped to a chat.
5. For a permitted reply, use the documented `sendMessage` API and track the actual send outcome. [TDLib getting started](https://core.telegram.org/tdlib/getting-started)

MGC design recommendation: run a TDLib adapter in a persistent worker with protected storage and restart recovery. Keep its database outside this repository and static publish directory. Access it through TDLib, not ad hoc SQL against its internal files. Expose only scoped application operations to TrueAssist; credentials and database keys stay server-side. This worker is proposed, not provisioned.

## Choose the Telegram interface deliberately

| Requirement | Candidate | MGC decision rule |
|---|---|---|
| Incoming conversations addressed to an MGC bot | Telegram Bot API | Evaluate this first for the bot relay already proposed in Alex's README. |
| A Telegram client session and history available to that authorized account | TDLib | Record the required client capability and account scope before adopting persistent infrastructure. |
| Slack, WhatsApp, portal, or email messages | A separate adapter for that channel | TDLib does not supply these transports or their authorization. |

The Bot API is HTTP-based and offers webhook or polling update delivery. Its scope differs from an account client; it does not provide arbitrary account history. Consult its current update, file, and sending methods when implementing a bot. [Telegram Bot API](https://core.telegram.org/bots/api)

## Connect to the work already in this folder

Local files are implementation evidence, not proof of production configuration:

| Local source | Existing responsibility / use in follow-up |
|---|---|
| [TrueAssist function](../../../netlify/functions/trueassist.js) | Website chat, lead capture, conversation sessions, and Slack escalation; inspect before extending routing. |
| [Slack events function](../../../netlify/functions/slack-events.js) | Slack thread replies to chat messages, human takeover, and routed staff event logging. |
| [Chat migration](../../../supabase/migrations/20261004040000_trueassist_leads_chat.sql) | Defines `mgc_leads`, `mgc_chat_sessions`, and `mgc_chat_messages`; inspect later migrations and the actual schema before proposing changes. |
| [TrueAssist architecture](../../../docs/trueassist-architecture.md) | Chat and Slack flow; setup claims require fresh verification. |
| [Alex tools](../tools/README.md) | Working area for integrations when an implementation task is authorized. |

Proposed flow: channel adapter → verified conversation mapping → shared message record → Alex routing / permitted context lookup → specialist or human → response through the originating channel. Keep external channel identifiers alongside MGC conversation identifiers. Do not replace the application store with the TDLib cache.

Clients need authorized project/support context; prospects need verified service/pricing and lead context; partnership requests need a business-development handoff. Route using current role records and [staff workspace guidance](../../README.md). Load email-specific instructions only when an email task is involved.

## Grok voice translation

At review time, xAI lists `grok-voice-3.0` as its voice model and `grok-voice-latest` as an alias. Speech-to-speech uses a realtime WebSocket API, supports multilingual conversations and tools, and distinguishes server API keys from short-lived client tokens. Recheck these identifiers before implementation. The user's “Grok 3.0” request should be resolved to the voice product explicitly, not assumed to mean a text model. [xAI speech-to-speech documentation](https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech)

xAI also documents separate speech-to-text and text-to-speech interfaces. These are candidates for processing recorded voice notes, while realtime speech is a separate interaction path. [xAI voice overview](https://docs.x.ai/developers/model-capabilities/audio/voice)

Proposed translation flow: authorized audio → transcript → explicit source/target language translation → TrueAssist context lookup and routing → reply text → optional speech → original channel. Multilingual conversation support alone is not evidence of tested translation quality. Preserve original text, translation, language choices, provider/model, and message linkage. Confirm unclear names, amounts, dates, and commitments; retain a human/text fallback. Do not give the voice model unrestricted database or messaging access.

## Implementation record

Use [COMMUNICATIONS-FOLLOW-UP.md](../COMMUNICATIONS-FOLLOW-UP.md) for open decisions, tasks, and evidence. This reference establishes no live integration. Native Telegram sessions, shared conversation storage, Slack/WhatsApp delivery, and voice processing each require their own verified implementation.
