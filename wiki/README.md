# MGC implementation wiki

Owner: Mark Garcia Cartwright / MGC Global Consulting. Start at [the index](index.md). Implementation entry points are in [CLAUDE.md](../CLAUDE.md).

## Storage rules

- `raw/`: immutable supplied sources. Add a new dated file for a new version; never edit an ingested source.
- `pages/`: concise specifications and synthesis. Link sources and related pages; distinguish observed behavior from proposals.
- `index.md`: catalog every page with a one-line description; refresh on ingest.
- `log.md`: append entries using `## [YYYY-MM-DD] action | Title`; never rewrite history.
- Standard relative Markdown links work in editors and Obsidian. An existing root `.obsidian/` directory was observed; cloud/vault synchronization has not been verified.
- This repository publishes from its root. Store only non-secret implementation notes here; no company account exports, balances, OAuth tokens, or personal financial records.

## Page schema, version 1

Every `pages/*.md` begins with YAML frontmatter:

- `title`: nonempty quoted string.
- `type`: `spec` or `concept`.
- `status`: `draft`, `ready`, `implemented`, or `archived`.
- `owner`: quoted string.
- `created`, `updated`: quoted ISO dates (`YYYY-MM-DD`).
- `tags`: nonempty YAML string list from `mgc`, `quickbooks`, `accounting`, `integration`, `design`, `webgl`, `static-site`.

Each page must be linked from the index and contain a source/reference section. Local links must resolve within this workspace. `draft` means there are implementation decisions or prerequisites remaining, not that the research is unfinished. Do not claim tests, external sync, or deployment happened unless verified.
