---
title: "MGC QuickBooks Account integration"
type: spec
status: draft
owner: "Mark Garcia Cartwright"
created: "2026-10-03"
updated: "2026-10-03"
tags: [mgc, quickbooks, accounting, integration]
---

# MGC QuickBooks Account integration

## Call this task

> Read CLAUDE.md and wiki/pages/quickbooks-account-spec.md. Implement the sandbox account lookup and service-item mapping described here. Preserve static Netlify hosting. Start with read-only account access; do not create accounts, send invoices, or deploy as part of that lookup task. Report changed files, checks, and unresolved prerequisites.

Prepared specification only; no QuickBooks company was accessed. Related: [visual experience](lycoris-experience-spec.md) · [index](../index.md).

## Intended outcome

Mark can identify the correct company accounts and associate MGC services with the right QuickBooks service Items. Proposed first milestone: server-side, owner-authorized account discovery and validated service mapping. A future admin selector is optional. Chart-of-accounts editing is a later task requiring specific business instructions.

## Verified API essentials

An Account is a chart-of-accounts ledger, not a customer or login. Sandbox host: `https://sandbox-quickbooks.api.intuit.com`; production host: `https://quickbooks.api.intuit.com`. Paths below are relative to `/v3/company/{realmId}`.

| Operation | Request |
|---|---|
| Read | `GET /account/{accountId}` |
| Query | `GET /query?query={encodedSelect}` |
| Create | `POST /account` |
| Update | `POST /account` with existing `Id` and current `SyncToken` |

Creation requires `Name` and either `AccountType` or `AccountSubType`. Names must be unique, at most 100 characters, and contain neither double quotes nor colons. Deactivation uses `Active: false`; historical references survive. Full updates can clear omitted writable fields. Treat `Classification`, `FullyQualifiedName`, and balances as response fields. Read-modify-write must handle stale `SyncToken` conflicts. [Intuit Account reference](https://developer.intuit.com/docs/api/accounting/account).

Use the Account's ID for an Item's `IncomeAccountRef`; invoice sales lines refer to the Item through `SalesItemLineDetail.ItemRef`. These are different IDs. Service Items represent work such as consulting. Check the selected company's locale and valid posting-account requirements before assigning an Item. [Intuit Item reference](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/Item).

OAuth uses the accounting scope `com.intuit.quickbooks.accounting`; authorization exchanges a code for tokens, and subsequent refreshes must preserve the latest returned refresh token. [Intuit OAuth client guidance](https://developer.intuit.com/app/developer/qbo/docs/develop/sdks-and-samples-collections/ruby/oauth-ruby-client).

## Current repository evidence

| File | Observed behavior and implementation consequence |
|---|---|
| [request-invoice.js](../../netlify/functions/request-invoice.js) | Refreshes a token, finds/creates a customer, creates an invoice, and attempts invoice email. Uses hard-coded Item ID `1` and `minorversion=65`. Does not persist returned refresh tokens or check every HTTP response. Calling this handler is a write/send action, not a read-only smoke test. |
| [quickbooks.js](../../integrations/lib/quickbooks.js) | Separate Express integration reads payments, invoices, and customers. Caches access tokens in memory; refresh uses an environment token. No exported Account reader exists. This server is not deployed by Netlify. |
| [root package.json](../../package.json) | Static site dependencies; no frontend build or root test script. |
| [services.html](../../services.html) | Existing services and invoice UI supply the business names to map. |

The helper's “client credentials” comment does not mean a client-credentials grant: its request uses `grant_type=refresh_token`. Neither refresh implementation persists a rotated token. Do not copy those gaps into a new client.

## Proposed contract and file boundaries

- Add a server-only helper under `netlify/functions/lib/quickbooks.js` for validated environment selection, company binding, token access, request timeouts, and redacted provider errors. This is a proposed file, not the existing Express helper.
- Add `netlify/functions/qb-accounts.js` only after locating a trustworthy server-side owner/admin authorization mechanism. Supabase sign-in alone does not establish an administrator. CORS is not authorization.
- Proposed interface: authenticated `GET /.netlify/functions/qb-accounts` for list, or `?id={id}` for one account. Bind the company on the server; reject caller-supplied company IDs, arbitrary query strings, unsupported methods, and invalid parameters.
- Return an allowlisted display shape (`id`, `name`, `type`, `subtype`, `active`, optional `parentId`) and pagination metadata. No tokens or balances are needed for the selector. Use `Cache-Control: no-store` and preserve restricted CORS.
- Define local response cases: 400 invalid request, 401 unauthenticated, 403 unauthorized, 405 method, and a sanitized provider/unavailable response. Missing configuration must fail clearly without exposing its values.
- Existing variable names: `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_REFRESH_TOKEN`, `QB_REALM_ID`, `QB_ENVIRONMENT`. Keep values server-side. Choose and document durable encrypted token storage with concurrent-refresh protection before production use; Supabase is an option, not an existing integration assumed by this spec.
- Require explicit sandbox configuration during development. Recheck current Intuit minor-version and pagination documentation before coding; this research did not establish a current supported version or page-size limit. Do not silently inherit `65` or default a missing environment to production.
- Use bounded retries for safe reads and transient failures. Do not blindly retry writes. A failed accounting provider must still preserve the existing independent Slack notification behavior.

## Proposed service mapping

Use existing company Items wherever possible. The names below describe MGC service families; they are not new ledger names or instructions to change accounting classifications.

| MGC family | Proposed mapping key |
|---|---|
| AI consulting and strategy | `ai-consulting` |
| AI workshops | `ai-workshops` |
| Workflow automation | `automation` |
| CRM optimization | `crm-optimization` |
| Systems design | `systems-design` |
| Retainer support | `retainer-support` |

Resolve the site's actual service identifiers during implementation. Store approved mapping values by company and environment, validate the referenced Item, and replace the invoice handler's literal `1` only after sandbox checks. Never insert an Account ID directly into `ItemRef`. Mark or the bookkeeper selects existing accounts; do not infer tax treatment or create six new accounts automatically.

## Short implementation sequence

1. Read this spec and the two QuickBooks files above. Check the working diff so the Claude pane's edits are preserved. Verify the intended sandbox company and server credentials without displaying them; verify the secret-rotation prerequisite already recorded in CLAUDE.md.
2. Establish owner authorization and durable refresh-token handling. If either is unavailable, complete local fixtures/helper work and report the missing prerequisite before enabling remote access.
3. Implement account read/query and explicit pagination using current Intuit docs. Encode query values; handle empty results, inactive records, and provider faults. Add focused tests with mocked responses.
4. Implement and validate the company-specific service-to-Item mapping. Keep invoice changes separate from read-only discovery; test invoice creation only with explicitly authorized sandbox writes and test email handling separately.
5. Run focused checks; update this page with results and exact remaining work. Report a reviewable diff. Push/deployment and production accounting actions must follow the current user's authorization.

## Acceptance checks

- Missing/invalid login and non-owner access fail before any provider request; cross-company input cannot change the bound company.
- List, single-record, empty list, multiple pages, inactive records, invalid configuration, expired tokens, provider faults, and throttling have deterministic results.
- Token rotation survives a restart; concurrent requests do not overwrite newer refresh tokens. Tests/logs never reveal credentials.
- A mapping cannot use a sandbox ID in production or silently fall back to Item `1`. Invoice regression fixtures verify the correct Item reference and independent downstream failure handling.
- No frontend credentials, new React dependency, or changes to Stripe allowlists/security headers.
- The existing Express webhook simulation can contact real providers through its running server. It is not an isolated unit test; use mocks or an explicitly configured sandbox.

## Sources and remaining decisions

Studied on 2026-10-03: the [requested Account URL](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account) returned an application shell to the text reader; the indexed official [Account reference](https://developer.intuit.com/docs/api/accounting/account) supplied the API details above. Supporting Item/OAuth references are linked beside their claims. Revisit [query documentation](https://developer.intuit.com/app/developer/qbo/docs/learn/explore-the-quickbooks-online-api/data-queries) and [minor versions](https://developer.intuit.com/app/developer/qbo/docs/learn/explore-the-quickbooks-online-api/minor-versions) during implementation; their content was not available in this research pass.

Decisions still needed when implementation is called: intended company/locale, owner authorization mechanism, token store, existing Item/account mapping, and whether an admin UI is wanted. The read-only milestone is a proposed starting scope, not a claim that Mark requested account CRUD.
