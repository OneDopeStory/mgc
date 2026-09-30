# Cloud Notes

## Supabase Glossary Review

Source: https://supabase.com/docs/guides/resources/glossary
Reviewed: 2026-06-04

The Supabase glossary is a quick reference for auth, identity, token, and security language used across Supabase docs. For this repository, the most relevant connection is `dashboard.html`, which uses Supabase browser auth and realtime subscriptions.

### Core Takeaways

- Authentication (`authn`) verifies who a user is.
- Authorization (`authz`) verifies what an authenticated identity is allowed to access.
- A browser session is represented by an access token plus a refresh token.
- Access tokens are short-lived JWTs, commonly valid for no more than about 1 hour.
- Refresh tokens are long-lived and are exchanged through the refresh token flow to renew access.
- JWTs carry identity and authorization information, and Supabase RLS policies can use JWT claims to decide row access.
- The JWT signing secret is highly sensitive. Anyone with it can create arbitrary JWTs, so it must never be exposed publicly or placed in client-side code.
- Row Level Security (RLS) policies are Postgres objects that control which rows and operations clients can access.
- OAuth is commonly used for social login. OIDC and SAML are common enterprise SSO protocols.
- PKCE protects OAuth flows for SPAs, mobile apps, and other clients where token exchange could be intercepted.
- MFA/2FA combines multiple identity factors. TOTP is the app-generated one-time password style used by authenticator apps.
- Nonces are unique, hard-to-guess values used to initialize secure flows or reduce replay attack risk.
- Password hashing functions such as Argon2, bcrypt, and scrypt let servers verify passwords without storing plaintext passwords.

### Memory Hook For This Site

When working on the MGC client portal or Supabase auth:

- Treat the anon key as browser-safe, but never expose service-role keys or JWT signing secrets.
- Keep RLS policies aligned with JWT/session identity.
- Remember that login proves identity, but RLS and policies still need to prove permission.
- Use PKCE-aware OAuth patterns for browser/mobile-style flows.
- Watch refresh-token behavior when debugging "logged out", stale session, or token renewal issues.

## Supabase External IDs / Notion Sync

Recorded: 2026-06-05

Use Supabase UUIDs as canonical Notion external IDs so Zapier, Make, n8n, or webhook services can upsert instead of duplicate records.

- Supabase project: `bjnpibxaxlgvlzeegwnm` (`https://bjnpibxaxlgvlzeegwnm.supabase.co`)
- Main identity key: `mgc_client_profiles.id` equals the Supabase Auth user UUID.
- Relationship key: `client_id` should point back to `mgc_client_profiles.id` / `auth.users.id`.
- Contact fallback key: `email`; use only when a Supabase UUID is unavailable.
- Avoid matching on names, company labels, or display text except for human-readable relations.
- Current Supabase-to-Notion webhook: `mgc_client_profiles` `INSERT` -> `/.netlify/functions/new-client-signup`.
- Webhook auth: `Authorization: Bearer {SUPABASE_WEBHOOK_SECRET}`.
- Do not expose service-role keys, JWT secrets, or webhook secrets to client-side code or Notion pages.

Canonical table keys:

- `mgc_client_profiles`: `id`, fallback `email`.
- `mgc_projects`: `id`, relation `client_id`.
- `mgc_deliverables`: `id`, relations `client_id`, `project_id`.
- `mgc_invoices`: `id`, relation `client_id`, business key `invoice_number`, payment key `stripe_payment_intent_id`.
- `mgc_bookings`: `id`, fallback `email`; next fix should add `client_id` on insert from `dashboard.html`.
- `mgc_messages`: `id`, relation `client_id`.
- `mgc_uploads`: `id`, relation `client_id`, file pointer `file_url`.
- `mgc_questionnaires`: `id`, relation `client_id`.

Note: `onboarding-assistant.html` does not call Supabase directly. It posts to `/.netlify/functions/lead-intake`, which writes to Notion directly.
