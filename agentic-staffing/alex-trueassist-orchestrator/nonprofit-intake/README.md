# Nonprofit Launchpad — intake workspace

Alex's workspace for turning a prospective nonprofit founder's raw voice note/whisper
transcript into the three Launchpad Advisory drafts (Form 1023 narrative, Maryland SDAT
registration profile, modular business plan summary) and tagging the prospect into the
MGC CRM under `consulting_vertical: 'nonprofit_capacity'`.

**Current status:** specification + local drafting workspace only. No Supabase write path
or Hostinger (Hermes) connection is active yet — see `AUTOMATION.md`. Today, a session
writes drafts and a manifest here by hand; nothing syncs automatically.

## Files

- [AGENTS.md](AGENTS.md) — extraction and mapping rules Alex follows, status gates,
  professional-review requirement on filing documents.
- [AUTOMATION.md](AUTOMATION.md) — the sync design (Supabase as source of truth, local
  files and Hostinger/Hermes as two surfaces into it) and what's still needed to activate it.
- [draft-manifest.example.json](draft-manifest.example.json) — manifest contract, one per
  prospect.
- [drafts/](drafts/) — one subfolder per prospect, holding the three generated documents
  plus `manifest.json`.

## Start here

"Take this transcript from [prospect name] and draft their Launchpad intake" →
read `AGENTS.md`, extract fields, write the three documents under
`drafts/<prospect-slug>/`, write `manifest.json` from the example contract, report
`missing_fields` and `review_status` for each document. Do not mark a Form 1023 or SDAT
draft anything other than `PROFESSIONAL_REVIEW_REQUIRED` — see AGENTS.md.
