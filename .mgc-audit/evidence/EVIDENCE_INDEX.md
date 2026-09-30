# Evidence Index: MGC Website Audit (2026-09-30)

| File | Contents | Supports findings |
|---|---|---|
| `crawl-manifest.json` | 98 discovered URLs, each with its class (inspected_unique / duplicate_alias / failed_404 / crawler_artifact), status, redirect chain, title, description length, canonical, robots, H1, link/image/video/form counts, phone numbers and emails found, and content hash. Also includes asset statuses, video sizes, exclusions and discovery-source counts | F-01, F-03, F-04, F-06, F-09, F-10, F-11 |
| `lh-summary.json` | Lighthouse 12.8.2 category scores and core metrics for 4 runs (home mobile and desktop, services mobile, ai-consulting mobile) | F-05, F-14, F-16 |
| `../tools/crawl.mjs` | Crawler that uses no Firecrawl credits. It only sends GET requests, never submits forms and skips `/.netlify/functions/*`. It reads `seeds.json` from its own folder and writes `pages.json`, `assets.json` and `external.json` beside itself | Rerun |

**Not saved here, to keep the folder small and free of private data:**
- raw HTML snapshots
- full Lighthouse JSON reports
- mobile screenshots (`shot-home-390.png`, `shot-services-390.png`)

These stayed in the session scratchpad and are regenerated on the next run.

**Point checks run live and recorded in the audit text:**
- Publicly served internal files (F-02): each was status-checked and pattern-scanned for secrets. Counts only were recorded; no values were saved.
- Supabase project refs in the live versus local dashboard (F-12).
- Location strings found per page (F-09).
