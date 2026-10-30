# MGC Global Consulting — Email operations

Alex’s shared reference for drafting MGC emails and routing updates through Hermes after cloud setup. Created 2026-10-26 from the owner’s instructions and [Email Education source](reference/email-education-source.csv).

**Current status:** 25 personalized staff templates and five generic starter drafts are saved locally. No Gmail drafts, scheduled jobs, event subscriptions, Slack posts, Telegram posts, or cloud deployment were created. This workspace defines how to create and review them when the integrations are connected.

## Staff workspaces

| Email identity | Responsibility | Workspace |
|---|---|---|
| Marcus Vance | Technology and backend architecture | [Emails](../../marcus-vance-cto/emails/README.md) |
| Elena Restora | Business development, sales, CRM promotions | [Emails](../../elena-rostova-bizdev/emails/README.md) |
| Jordan Hayes | Customer onboarding and coordination | [Emails](../../jordan-hayes-custops/emails/README.md) |
| Julian Vance | Billing and accounting | [Emails](../../julian-vance-accounting/emails/README.md) |
| David Ken | Technical support | [Emails](../../david-kim-techsupport/emails/README.md) |

Names follow the owner’s latest instruction. Folder slugs remain stable; `elena-rostova-bizdev` maps to Elena Restora and `david-kim-techsupport` maps to David Ken. Do not rename folders or create competing email identities from older names.

## Start here

- [AGENTS.md](AGENTS.md): common writing, identity, and review rules.
- [AUTOMATION.md](AUTOMATION.md): Alex/Hermes trigger and delivery handoff.
- [roles.json](roles.json): machine-readable template and draft paths, relative to this directory.
- [connections.example.json](connections.example.json): unconfigured destinations; no secrets.
- [draft-manifest.example.json](draft-manifest.example.json): draft tracking contract.
- [channels/](channels/): Slack/Telegram newsletter and owner brief formats, plus Gmail owner update.

## Requests Alex should understand

“Draft the onboarding welcome board for CRM customer [record ID] using Jordan’s email folder.”

“Have Elena prepare a promotion for [approved campaign] and [eligible CRM segment]. Keep it in drafts.”

“Have David draft an update for ticket [ID].”

“Have Julian prepare the invoice cover email for [invoice ID].”

“Have Marcus summarize the backend milestone for Mark and prepare the Slack update.”

“Prepare the newsletter for Slack and Telegram and a Gmail update for Mark.”

Only load the selected role, relevant template, and verified source records. Finish each request with the saved draft path, unresolved facts, review status, and delivery state. A successful local write is not a Gmail draft or a sent message.
