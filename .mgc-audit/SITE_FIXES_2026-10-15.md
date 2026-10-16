# Site fixes — October 15, 2026

Status: implemented locally; no push or deployment. The previous duplicate-address redirects are preserved.

## Changes

- Removed remaining emoji presentation characters from root and public-copy HTML, including the booking calendar's CSS-generated calendar. Kept ordinary punctuation, copyright marks and text arrows. Replaced icon-only emoji with inline SVG; removed decorative emoji beside existing labels.
- Normalized client portal navigation to `/dashboard`.
- Fixed a Supabase sign-in deadlock risk: authenticated portal queries now run after the auth-state callback releases its lock. Prevented queued initialization after sign-out, added visible Google/network/SDK-load errors, and supplied the portal return address for confirmation emails.
- Made the portal auth card scrollable on short screens and improved input placeholder contrast, mobile input sizing and focus outlines.
- Replaced ambiguous or invalid service checkout links with service selection; retainer selection goes to memberships. Membership buttons now carry their tier in the URL instead of relying on browser storage.
- Reworked checkout to show the selected service, an explicit Continue button, contact information, accessible errors, timeout recovery and a responsive card. It no longer creates a payment session on page load. A stale stored membership cannot override an explicit service selection.
- Added server-side compatibility with `STRIPE_PRICE_RETAINER`, retained the price allowlist and Stripe-authoritative billing mode, handled missing configuration without a module-load crash, validated request shapes, and retained the selection when a customer cancels Stripe Checkout. Return addresses are restricted to MGC's production domains.

## Verification

- 12 regression tests passed: mocked payment success, retainer configuration, malformed/unknown inputs, missing configuration, cancellation, stale selection, failed payment connection, unsafe redirect rejection and deferred portal initialization/sign-out/refresh behavior.
- Parsed 26 inline scripts and both checkout scripts successfully. `git diff --check` passed.
- Automated scan found no remaining emoji presentation characters in root/public HTML or direct JavaScript/CSS assets examined.
- Browser checks at 390px: checkout selection and connection-error screens render correctly; sign-up card fits with no horizontal overflow; the portal loading overlay clears. Checkout DOM check at 1440px also found no horizontal overflow.
- Live `/dashboard` and local dashboard both point to MGC's `bjnpibxaxlgvlzeegwnm` project. Its public Auth settings returned HTTP 200, with Google/email enabled and signup enabled. No customer records were accessed.
- Current live `/checkout` no longer contains the screenshot's “Integration Pending” alert. The screenshot represents an earlier served version; the remaining code defects were corrected locally.
- The account-level Supabase connector denied access. Stripe connector authentication did not yield account access after a retry. Live Stripe keys, prices and fulfillment settings remain unverified. No live checkout session, payment, account or booking was created.
- Real authenticated portal data loading and Google OAuth completion remain to be checked by the owner. The preview origin in the supplied portal screenshot may need to be listed in Supabase's redirect allowlist; this account setting could not be inspected.

Tests: `node --test tests/checkout-regression.test.cjs tests/portal-auth-regression.test.cjs`

## Before publication

Use a reviewed deployment containing only intended public files and functions, not an unchecked upload of the repository root. Confirm required Stripe environment variables and active prices using the MGC account. Verify clean-path redirects and query preservation on the deployed preview. Production publication was not performed in this task.

## Evidence and sources

- [Mobile checkout](evidence/checkout-mobile-fixed.jpg)
- [Mobile portal](evidence/portal-mobile-fixed.jpg)
- [Supabase callback deadlock guidance](https://supabase.com/docs/guides/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0)
- [Supabase OAuth reference](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
- [Stripe Checkout Session API](https://docs.stripe.com/api/checkout/sessions/create)

Sources and live observations checked October 15, 2026. No production settings or credentials changed.
