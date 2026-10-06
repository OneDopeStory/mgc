# MGC site audit and fix checklist (2026-10-04)

Scope: the static site in this folder. Checked by reading the HTML, `netlify.toml`, and `netlify/functions/create-checkout.js`. Not checked in a live browser yet.

Out of scope for this thread: Supabase, auth, Netlify env vars, and function wiring (owned by the "Fix Supabase login and sync" thread). No deploys.

## Source of truth for offers (from Mark, 2026-10-04)

| # | Service line | Price |
|---|---|---|
| 1 | AI Strategy & Consulting | $750 – $2,450 |
| 2 | Intelligent Automation Architecture | $1,500 – $4,500 |
| 3 | CRM & Pipeline Optimization | $950 – $3,800 |
| 4 | Operational Systems Design | Custom / Enterprise |
| 5 | AI Education & Workforce Workshops | Hands-on training |
| 6 | Retainer & Fractional AI Ops | $199/mo – $1,299/mo |

## P0: wrong or broken (fix first)

1. **services.html, Systems Design card** shows `$2,200` one-time with a Pay Now button. Should read Custom / Enterprise, with Book a Scoping Call and Request Proposal instead of Pay Now.
2. **services.html, Monthly Retainer card** shows `$1,950/mo, 3-month minimum`. Should read $199 – $1,299/mo and route to the three membership tiers.
3. **retainer-support.html** lists all three tiers as `Custom / month`. Should show $199, $499, $1,299 per month to match `membership.html` and the home page.
4. **Error pages missing at the site root.** `netlify.toml` routes `/404` and `/403` to `/404.html` and `/403.html`, but those files exist only in `public/`. Netlify publishes `.`, so visitors get Netlify's default page. Copy `404.html`, `403.html`, `500.html` to the root.
5. **`/terms` is linked from the footer** of `index.html` and `onboarding-assistant.html` and has no page. Add a draft `terms.html` (marked for legal review, like `privacy.html`) and a `/terms` route.
6. **Mobile nav overflows on services.html and membership.html.** The nav is an inline `display:flex` row with no wrap and no menu toggle, so links run off-screen on phones. `book.html` and `privacy.html` wrap but have no toggle either.

## P1: conversion and positioning

7. **Service detail pages carry no price anchor.** ai-consulting, automation, crm-optimization, systems-design, ai-workshops, retainer-support each need an "Investment" strip with the price from the table above and two CTAs: Book a Strategy Call (`index.html#booking`) and See all services (`services.html`).
8. **crm-optimization.html** says companies spend "$4,000–$15,000+" setting up a CRM. That is a market stat, not MGC's price, but it sits where a reader expects MGC's price. Keep the stat, add MGC's $950 – $3,800 directly after it.
9. **Positioning line.** Home says "Owings Mills, Maryland" and "national reach" in one place. Service pages never say where MGC is or who it serves. Add one consistent line to each service hero: "Maryland-based. Serving clients nationwide."
10. **CTA wording varies:** "Start a Project", "Book a Call", "Contact", "Support". Standardize the primary CTA to **Book a Strategy Call** and the secondary to **See Services**.
11. **services.html and membership.html** have no Open Graph tags or canonical link. checkout, thank-you, success, partner-success have no meta description (lower priority; they should also be `noindex`).

## P2: code hygiene (no visible change)

12. Inline hex colors in `style=""` attributes on every service page (4 to 8 per page), against the `var(--token)` rule in `BRANDING.md`. Replace with tokens or a shared `.btn-primary` class.
13. Service pages still call the HubSpot script with a protocol-relative URL (`//js.hs-scripts.com/...`). Change to `https://`.

## Status (end of 2026-10-04 pass)

Done as uncommitted edits, checked in a local browser at 375px and desktop: items 1 to 10 and 12 to 13 on the six service pages, services.html, membership.html, retainer-support.html. New files: `404.html`, `403.html`, `500.html`, `terms.html`, `assets/mobile-nav.css`, `assets/mobile-nav.js`. Netlify serves `terms.html` at `/terms` without a route change.

Also fixed along the way:
- The services hero sat under the fixed nav.
- The membership comparison table made the page scroll sideways on phones.
- On services.html, the invoice request showed "sent" before the request finished and hid failures. It now waits for the response and shows an email fallback if the request fails.

Not done: item 11 for checkout, thank-you, success, and partner-success (meta/noindex). book.html and privacy.html keep their wrapping nav, with no toggle.

New issues found:
- **Free call versus paid session.** The final CTAs on ai-consulting.html and automation.html promise a "free 30-minute" call, but the booking flow sells a 60-minute session for $160. The new Investment sections say "strategy session" so they don't add to the conflict.
- **Two addresses.** The services.html footer says "Baltimore, MD 21202". The home page says Owings Mills.
- **Old error pages.** `public/404.html` belongs to a different site template (Directory, Members, Join links). The new root pages replace it for production.

## Needs Mark's decision

- **Workshops price.** You listed workshops as "Hands-on training" with no price. services.html sells a Half-Day Briefing at $1,200 and a Full-Day Bootcamp at $2,900 with Pay Now buttons. Default: keep those two prices, since they don't conflict with your list.
- **Git state.** A merge is half-finished on `main` (`README.md` conflict between the full README and a two-line stub from GitHub). Nothing can be committed until it's resolved.
