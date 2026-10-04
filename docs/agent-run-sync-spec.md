# Agent Run Sync Spec

DRAFT. Companion to `data/schema_agent_runs.sql` (not applied).

## 1. Source of truth

- **Supabase is primary.** Runs, events, approvals, and progress are written and read there. Google Sheets is a one-way backup mirror.
- **Supabase wins conflicts.** Sheet edits are overwritten by the next upsert or reconcile. The dashboard, RLS, Realtime, and approvals live in Supabase; one-way flow means the mirror is always rebuildable.
- Keep personal-document and client-confidential content out of `output_summary` and events. The Sheet is hosted by Google.

## 2. Write path

- **Agent runner** executes an agent (`site_auditor`, `invoice_drafter`, `booking_reminder`) wherever it runs: Netlify function, scheduled function, or local script.
- **Run recorder** is the shared server-side module and the only writer of runs and events. It uses `SUPABASE_SERVICE_ROLE_KEY` and catches its own errors, so a storage failure never crashes the run.
- **Approval endpoint** verifies the owner claim, sets `approved_by` and `approved_at`, then appends a state event.

**Append-only log.** Each change is one insert into `mgc_agent_run_events`. A trigger projects `run_status` and `run_progress_pct` onto the run in the same transaction, so runs derive from events. Events are never updated or deleted.

**Transitions** (recorder-enforced): `queued` → `running`; `running` → `needs_review` (owner gate); `needs_review` → `running` (approved, resumes), `complete` (approved), or `cancelled` (rejected); `running` → `complete`, `failed`, or `cancelled`; `queued` → `cancelled`.

**Progress** comes from the agent at declared step boundaries, never from a timer. Values never decrease. At most one event every 5 seconds.

**Append on completion.** On a terminal state, the recorder awaits the Sheets append. Do not fire-and-forget; serverless runtimes can freeze after the response. The nightly reconcile is the safety net.

## 3. Realtime

- The dashboard reuses the admin page's Supabase client and owner session, then subscribes to `postgres_changes` on `public.mgc_agent_runs`. No polling.
- Realtime applies RLS to each change using the subscriber's JWT. Until the owner policy is enabled (a commented TODO in the SQL), the feed stays empty. This fails closed.
- **Manual step, owner approval needed:** add `mgc_agent_runs` to the `supabase_realtime` publication. It is commented in the SQL; nothing publishes until approved.
- Realtime does not replay missed changes. On every (re)subscribe, re-read the runs list and the open run's events.
- Render `title`, `output_summary`, and `message` with `textContent`, never `innerHTML`.

## 4. Sheets mirror

- Spreadsheet from `GOOGLE_SHEETS_BACKUP_ID`. Tabs `Runs` and `Events`, header in row 1.
- `Runs` columns, in order: `sheets_row_key`, `id`, `agent_key`, `title`, `status`, `progress_pct`, `requires_review`, `approved_by`, `approved_at`, `started_at`, `completed_at`, `created_at`, `updated_at`, `output_summary`.
- `Events` columns, in order: `sheets_row_key` (`evt:<id>`), `event_id`, `run_id`, `ts`, `level`, `message`.
- **Upsert by key.** Read column A once, map keys to row numbers, `batchUpdate` matches, and `append` the rest. Reruns never duplicate rows. Run keys (`run:<uuid>`) are stored on the run.
- **Nightly full reconcile:**
  1. Read both sides in full: terminal runs and their events from Supabase, both tabs from the Sheet.
  2. Compare row counts per tab. Equal counts can hide an offset, so also diff the key sets.
  3. Rewrite only missing or differing rows. Stamp `sheets_synced_at` on runs written.
  4. Delete duplicate-key rows, keeping the first. Append and reconcile can overlap.
  5. Retry open dead letters. Log residual mismatches as new ones.
- Each job re-reads keys before writing. One sync job runs per tab at a time.

## 5. Auth and secrets

Variable names only. Values live in Netlify or the local runner's secret store, never in files.

- `SUPABASE_URL`: server functions.
- `SUPABASE_SERVICE_ROLE_KEY`: **server only.** Never in `admin.html`, browser code, build output, logs, or the Sheet. It bypasses RLS and is the only writer of run data.
- Browser: publishable (anon) key plus the owner's signed-in session only.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY_B64`: already used for Calendar; confirm it is the same account. Decode the key in memory and request the spreadsheets scope.
- `GOOGLE_SHEETS_BACKUP_ID`: referenced by variable, never hard-coded.
- Owner check: a server-set `app_metadata` role claim. Never `user_metadata` (user-editable) or the browser-side `ADMIN_EMAILS` list.

## 6. Failure handling

- **Retry with backoff.** Retry 408, 429, 5xx, and network errors only: 3 inline attempts, about 1 s and 2 s with jitter, honoring `Retry-After`. Client errors (400, 403, 404) do not retry.
- **Dead letters.** After the last attempt, insert into `mgc_agent_sync_dead_letters` (run, tab, key, attempts, error, payload). The nightly reconcile retries open rows and sets `resolved_at`. Nothing drops silently.
- **Runs are never blocked.** Sheets failures are caught; the run still completes in Supabase.
- **Supabase outage:** nothing is buffered; the runner stops and logs. Accepted for now.
- **Dashboard.** Show "Last synced" (max `sheets_synced_at`) and a count of open dead letters, red when above zero. An old timestamp on a quiet day is expected.
- **Known gap:** an unscheduled nightly job raises no alarm. Add a heartbeat row if needed.

## 7. Owner actions

- [ ] Approve and run `data/schema_agent_runs.sql` in the Supabase SQL editor, after confirming the live project (CLAUDE.md flags conflicts).
- [ ] Set your user's `app_metadata.role` to `owner` server-side, sign out and back in, then uncomment and fill the owner-check policy.
- [ ] Approve the Realtime step: uncomment the publication block.
- [ ] Share the backup Sheet with the service account email as Editor, and enable the Google Sheets API in its project. Keep the Sheet private.
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_SHEETS_BACKUP_ID` to Netlify. Placeholder names only in `.env.template`.
