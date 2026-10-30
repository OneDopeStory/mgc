# Julian Vance — Email workspace

Customized for MGC Global Consulting LLC. These are reusable writing templates and a local starter draft; Gmail delivery and cloud triggers are not connected by these files.

Role: **Accounting & Financial Systems**. Use **Julian Vance** in email signatures. The existing folder slug `julian-vance-accounting` stays unchanged for routing; older roster spellings do not override this email identity.

| Template | Use when |
|---|---|
| [Welcome](templates/welcome.md) | Confirmed customer billing onboarding |
| [Newsletter](templates/newsletter.md) | Approved billing education newsletter |
| [Update](templates/update.md) | Reconciled invoice status change |
| [Terms Policy](templates/terms-policy.md) | Approved billing policy communication |
| [Invoice Cover](templates/invoice-cover.md) | Verified issued invoice ready for customer review |

Start with [the prepared draft](drafts/starter-draft.md), or ask Alex to draft a message from a listed template. A welcome template includes the requested welcome board/checklist.

Read [Alex’s rules](../../alex-trueassist-orchestrator/emails/AGENTS.md) and [workflow](../../alex-trueassist-orchestrator/emails/AUTOMATION.md) before drafting. Replace every `{{field}}` with verified information. Preserve the template; save each new customer draft in this folder’s `drafts/` directory. Never overwrite an existing reviewed draft. Record missing fields as blocked; no customer draft is ready while fields remain unresolved.

Use `drafts/YYYYMMDD-eventid-template.md` and a companion `.json` record using the shared manifest fields. Recipient data belongs only in private runtime storage. Generated drafts are excluded from git; the generic `starter-draft.md` stays versionable. The entire staff workspace is excluded from website deployments.

For newsletter sharing and owner updates, give Alex the verified content and private source reference; use [the channel formats](../../alex-trueassist-orchestrator/emails/channels/) rather than copying customer data into a channel.
