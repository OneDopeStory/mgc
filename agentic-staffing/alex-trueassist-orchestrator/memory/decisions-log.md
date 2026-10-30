# Alex — Decisions Log

Append-only. Add new dated entries to supersede old ones; never edit history in place.

---

### 2026-10-30 — Second Brain memory tree created

**Decision:** Build a 9-pillar memory tree (`memory/`) for Alex, since no persistent knowledge-base/second-brain structure existed before. Pillars: meeting notes, research, web clippings, daily notes, project files (routed to existing project folders, not duplicated), decisions log, workflows/SOPs, concepts, session memory.

**Why:** Owner directive (verbatim captured in `second-brain-directive.md`) — Alex needs to categorize and route all incoming MGC business information so it can later pull from it to direct requests to the correct staff member.

**How to apply:** Any future capture (notes, research, clippings, decisions) that needs to persist for Alex gets filed under the matching pillar folder here, not scattered into ad hoc files.

---

### 2026-10-30 — Mark's direct number captured; transfer rule stated (not yet buildable)

**Decision:** Mark's direct number is **240-962-9982**. When a caller asks Alex to be transferred to Mark, the call should reach this number. Alex handles all other dispatch.

**Why:** Owner directive, given while scoping the call-routing architecture (see `memory/concepts/call-routing-architecture-2026-10-30.md`).

**How to apply:** Do not build the live-transfer mechanism yet — it depends on confirming the Grok Voice/xAI call-transfer capability and resolving which number is actually Alex's public line (open question in the scoping doc above). This number is correct and safe to use once that's unblocked.

---

### 2026-10-30 — Corrected: one number, not two; transfer behavior; existing forwarding untouched

**Decision:** `410-339-8375` is both the public MGC hotline and Alex Romero's Grok Voice 3.0 line — one number, not two separate ones (corrects the 2026-10-27 record in `docs/grok-voice-architecture.md`, now struck through there). Default call behavior: Alex handles it. If urgent, Alex attempts to patch the caller through live to Mark (240-962-9982); exact API capability for this still needs confirming. Separately, a pre-existing call-forwarding path to Mark already works today (outside this repo's code, likely carrier/number-level) — **do not touch it** while building the Alex-side logic.

**Why:** Owner correction while scoping the call-routing architecture (see `memory/concepts/call-routing-architecture-2026-10-30.md`).

**How to apply:** Any future Grok Voice / tool-schema work should assume a single number. Don't build a parallel transfer mechanism that could conflict with the already-working forwarding path — confirm with the owner before changing any call-forwarding/telephony config outside this codebase.

---

### 2026-10-30 — Alex's oversight/reporting mandate stated explicitly

**Decision:** Alex's job is to oversee all five specialist staff (Marcus, Elena, Jordan, Julian, David) and report back all information to Mark "like a real world business structure in corporate and business" — i.e. Alex is accountable for knowing each specialist's status, not just routing tasks to them, and compiles a single upward report rather than Mark querying each agent separately.

**Why:** Owner directive, 2026-10-30. Builds on Alex's existing "100% daily report compilation" goal (`../README.md`) by making explicit that the report must roll up all specialists' status, not just Alex's own routing metrics.

**How to apply:** See `memory/concepts/staff-org-structure-and-reporting-2026-10-30.md` for the consolidated role reference and full mandate text. The owner also floated an "AI employee dashboard" (real-time progress, DB-backed, Google Sheets mirror) as the eventual reporting surface — scoped as a next-session plan, not yet built (`docs/next-session-plan-2026-10-30.md` at repo root).
