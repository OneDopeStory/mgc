# Hermes Agent: installation and integration references

Reviewed 2026-10-27. Documentation only; Hermes was not installed or connected during this task. Product reference: **Nous Research Hermes Agent**. Verify this is the intended distribution and record its release/commit when preparing installation.

## Official source index

| Source | What to consult it for |
|---|---|
| [Hermes documentation](https://hermes-agent.nousresearch.com/docs) | Product overview and navigation. |
| [NousResearch/hermes-agent repository](https://github.com/NousResearch/hermes-agent) | Source, releases, changelog, and version-specific behavior. |
| [Installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation) | Supported installation procedure and setup; `hermes gateway setup` configures messaging. Recheck the installed release before running commands. |
| [Messaging gateway](https://hermes-agent.nousresearch.com/docs/user-guide/messaging) | Background gateway, platform sessions, and connection states. Saved credentials, enabled configuration, a running gateway, and a connected platform are distinct states. |
| [Slack](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/slack) | Socket Mode connection, bot/app tokens, scopes, allowlists, and thread behavior. |
| [Telegram](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram) | Bot setup and supported Telegram interactions. Preserve this project's Bot API direction. |
| [WhatsApp bridge](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/whatsapp) | Existing personal/linked-device bridge compatibility; do not assume it is the owner's current provider. |
| [WhatsApp Business Cloud API](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/whatsapp-cloud) | Business messaging adapter, webhook setup, authentication, media, and limitations. |
| [MCP integration](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) | Scoped tool-server connections and per-server tool inclusion filters. |
| [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) | Optional connection from a protected origin to Cloudflare; not evidence that a tunnel already exists. |

Use the exact official domains above. Search results may include similarly named mirrors. Record installed version and verification date alongside configuration evidence; a current web guide may describe capabilities absent from an older installation.

## Fit with the existing project

The [cloud notes](../../../cloud.md) record Hostinger VPS as the intended Hermes runtime. Cloudflare may supply DNS, routing, or a tunnel, depending on the actual setup. A Cloudflare domain alone establishes none of those backend details. Cloudflare Tunnel uses an outbound connection from `cloudflared` on the origin; it does not relocate the Hermes process into Cloudflare. [Cloudflare documentation](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)

Hermes's documented Slack path uses Socket Mode and does not need a public inbound HTTP endpoint. The existing MGC Slack relay uses a Netlify HTTP event handler. Decide which process owns each subscription and reply before enabling Hermes; avoid duplicate answers and preserve human takeover. [Hermes Slack setup](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/slack)

The WhatsApp Cloud adapter uses a public HTTPS webhook, distinct from the linked-device bridge. Its current documentation describes restrictions on delayed replies outside the customer messaging window and says template sending is not yet implemented in that adapter. Check the installed version and actual provider before promising scheduled WhatsApp follow-ups. A verified webhook subscription does not by itself prove successful signed inbound delivery or outbound delivery. [Hermes WhatsApp Cloud guide](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/whatsapp-cloud)

Use a separate customer-facing tool profile from owner operations. Expose bounded application operations such as permitted client-context lookup and escalation through authenticated services; enforce authorization in those services. Hermes MCP tool filters help limit discovery but do not replace tenant/record authorization. [Hermes MCP guide](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)

Grok Voice remains a separately verified provider integration. Hermes voice support does not prove the requested Grok Voice 3.0 translation path is configured. See [the voice and TDLib reference](telegram-tdlib-communications.md).

## Installation handoff checklist

- [ ] Confirm Hostinger host/OS, intended Hermes distribution/version, service identity, persistent state directory, restart behavior, and backup/restore approach.
- [ ] Inventory current Slack and WhatsApp account owners and connection methods before creating replacements. Record secret names/locations only, not values.
- [ ] Select one event consumer/reply owner per channel and an explicit mapping to MGC conversation IDs.
- [ ] Set platform access scope and customer/owner tool boundaries. Unknown prospects may submit public inquiries but cannot retrieve private client data or invoke owner tools.
- [ ] Verify Cloudflare hostname/service/origin. If an HTTPS callback is needed, expose only its required route with provider verification; keep admin/agent-control endpoints separately authenticated. A human login page must not intercept provider callbacks.
- [ ] Exercise a permitted test conversation, handoff, duplicate delivery, failed send, reconnect, and restart; confirm each event appears once in the admin feedback trail.
- [ ] Record version, time, deployment status, test evidence, and remaining gaps in [the follow-up](../COMMUNICATIONS-FOLLOW-UP.md).

The proposed application integration is specified in [the cloud connectivity and feedback brief](../CLOUD-CONNECTIVITY-AND-FEEDBACK.md). Its durable event processing, CRM mapping, and KPI reporting are application work to implement and verify, not guaranteed Hermes defaults.
