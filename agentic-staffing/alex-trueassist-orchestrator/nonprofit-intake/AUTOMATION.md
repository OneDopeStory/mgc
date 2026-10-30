# Future sync — local drafts, Supabase, Hostinger (Hermes)

**Specification only; no sync process is installed by this folder.** The owner wants
one save to reach all three surfaces (local review files, the live CRM, and the
Hostinger VPS where Alex eventually runs continuously). This document is the design
and the activation contract.

## Why one source of truth instead of three independent copies

Mirroring three stores that each get written separately means a failed write on any
one leaves the others silently ahead — there is no way to tell which copy is
authoritative after a partial failure. Instead:

- **Supabase (`mgc_leads` + `mgc_deals`, tagged `consulting_vertical = 'nonprofit_capacity'`,
  plus `mgc_nonprofit_documents` for the three generated texts) is the single source of
  truth.** See `supabase/migrations/20261028000000_mgc_nonprofit_intake.sql` (drafted,
  not yet applied — same unapplied status as `mgc_deals.sql`).
- **Local files under `drafts/<prospect-slug>/`** are a staging/review copy — the same
  role `emails/drafts/` already plays for email. Useful today because there is no live
  Supabase write path wired from a Claude Code session, and no VPS yet.
- **Hostinger (Hermes Agent)** will, once live, read and write the same Supabase tables
  directly — it does not need a separate copy, and it cannot reach local repo files
  (different machine).

Net effect once activated: a save from any surface lands in Supabase, and both other
surfaces read from there — functionally "saved everywhere," without three stores that
can disagree.

## Current blockers (do not build past these without owner input)

1. **Hostinger VPS is not live.** Per `project_hermes_agent_setup.md`, Hermes deployment
   is at Step 1 of 21 (VPS just provisioned, awaiting owner report). There is no SSH
   access, hostname, or running agent to connect to. Nothing in this folder should
   assume a reachable VPS until that status changes.
2. **The Supabase migration is drafted, not applied.** Run it via the Supabase SQL
   Editor or `supabase db push` for project `bjnpib` after owner review, same as
   `mgc_deals.sql`.
3. **No write function exists yet** to push a local `manifest.json` + its three
   documents into Supabase. The natural owner is a new Netlify function (or an
   extension of `netlify/lib/leads.js`'s `recordLead`) that upserts `mgc_leads`/
   `mgc_deals` and inserts into `mgc_nonprofit_documents`, keyed by the manifest's
   `idempotency_key` so a retry never double-inserts.

## Activation inputs still needed

Supabase migration applied; a Netlify function (or CLI script) that reads
`manifest.json` + the three draft files and upserts Supabase; Hostinger VPS reaching at
least Hermes setup Level 2+ (model connection) before it can run Alex continuously;
confirmation of which system commits the professional-review sign-off for Form
1023/SDAT drafts (likely a `mgc_nonprofit_documents.reviewed_by`/`reviewed_at` pair
set by a human, never by Alex).

Before calling this automation active, test: writing a manifest + documents locally,
then running the sync script, creates exactly one `mgc_leads` row and one
`mgc_nonprofit_documents` row per document type; a replay with the same
`idempotency_key` creates neither a duplicate lead nor duplicate documents; a
`BLOCKED_MISSING_FACTS` document is never synced as `DRAFT_FOR_REVIEW`; and a
Form 1023/SDAT document can never reach a synced state other than
`PROFESSIONAL_REVIEW_REQUIRED` without a recorded reviewer.
