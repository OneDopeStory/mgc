# MGC Obsidian Theme — Setup Instructions

## Activate the Theme

1. Open Obsidian
2. Open this vault: File → Open Vault → Select `MGC-Vault` folder
3. Go to **Settings → Appearance → CSS Snippets**
4. Toggle ON `mgc-theme`

## Recommended Plugins (install via Community Plugins)

| Plugin | Purpose |
|---|---|
| **Templater** | Use templates from the Templates/ folder |
| **Dataview** | Query your leads/clients like a database |
| **Calendar** | Visual calendar linked to daily notes |
| **Kanban** | Visual pipeline board from your leads |
| **Natural Language Dates** | Type "next Friday" and it resolves |
| **QuickAdd** | One-keystroke lead/client/meeting creation |

## Templater Setup
Settings → Templater → Template folder location → `Templates`

## Dataview — Pipeline Query
Paste this in any note to see your live pipeline:

```dataview
TABLE company, stage, score, value, contact
FROM "01 - Leads"
WHERE type = "lead"
SORT score DESC
```

## Dataview — Active Clients
```dataview
TABLE company, tier, mrr, renewal_date
FROM "02 - Clients"
WHERE type = "client" AND status = "Active"
SORT renewal_date ASC
```
