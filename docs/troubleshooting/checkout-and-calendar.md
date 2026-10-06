# Checkout and Google Calendar: causes and fixes

Diagnosed 2026-10-05 from live Netlify function logs, the live Stripe account (MGC Global Consultation, live mode) and the code in `netlify/functions/`. Look here first if checkout or bookings break again.

## 1. Checkout: "Unable to start checkout: Checkout session creation failed"

**Cause.** The live log for `create-checkout` says `No such price: 'price_1R0C2y1a75sXZuzC8sY2u6v4'`. That ID is in the Netlify variable `STRIPE_PRICE_AI_CONSULTING_ASSESSMENT`, but it isn't a live price in your Stripe account. It's an old or test-mode ID. The other `STRIPE_PRICE_*` variables were probably set at the same time, so they may be stale too.

**Second cause (fixed in code).** Some of your live Stripe prices are monthly subscriptions, but the function used one-time `payment` mode for every service. Stripe rejects that combination. `create-checkout.js` now reads the price from Stripe and picks one-time or monthly automatically.

**Fix (your part).** In Netlify, under Project configuration and then Environment variables, set each variable to the live price ID below. Use the same value for all deploy contexts.

| Netlify variable | Live Stripe product | Price | Billing |
|---|---|---|---|
| `STRIPE_PRICE_AI_CONSULTING_ASSESSMENT` | AI Readiness Assessment | $950 | one-time |
| `STRIPE_PRICE_AI_CONSULTING_ROADMAP` | 90-Day AI Roadmap | $1,500 | **monthly** |
| `STRIPE_PRICE_AUTOMATION_STARTER` | Automation Starter Pack | $1,500 | one-time |
| `STRIPE_PRICE_AUTOMATION_FULL` | Full Automation Build | $4,500 | one-time |
| `STRIPE_PRICE_CRM_AUDIT` | CRM Audit & Cleanup | $950 | **monthly** |
| `STRIPE_PRICE_CRM_BUILD` | Full CRM Build + Training1 | $3,800 | one-time |
| `STRIPE_PRICE_WORKSHOP_HALF` | Half-Day AI Bootcamp | $2,500 | one-time |
| `STRIPE_PRICE_WORKSHOP_FULL` | Full-Day AI Bootcamp | $2,900 | one-time |
| `STRIPE_PRICE_SYSTEMS_DESIGN` | System Designs | $2,200 | one-time |
| `STRIPE_PRICE_MONTHLY_RETAINER` | Monthly Retainer | $500 | monthly |
| `STRIPE_PRICE_MEMBERSHIP_STARTER` | Starter Membership | $199 | monthly |
| `STRIPE_PRICE_MEMBERSHIP_PRO` | Pro Membership | $499 | monthly |
| `STRIPE_PRICE_MEMBERSHIP_ELITE` | Elite Membership | $1,299 | monthly |

Live price IDs, in the same order:

```
STRIPE_PRICE_AI_CONSULTING_ASSESSMENT=price_1TAaXA1a75sXZuzCHhIWMVr5
STRIPE_PRICE_AI_CONSULTING_ROADMAP=price_1TAad51a75sXZuzC7QjsjCR4
STRIPE_PRICE_AUTOMATION_STARTER=price_1TAahq1a75sXZuzCafizBRBe
STRIPE_PRICE_AUTOMATION_FULL=price_1TAXU21a75sXZuzCKNUxn5wb
STRIPE_PRICE_CRM_AUDIT=price_1TAWs81a75sXZuzCK9xZ6b9S
STRIPE_PRICE_CRM_BUILD=price_1TAWgC1a75sXZuzCZ1C7YGOk
STRIPE_PRICE_WORKSHOP_HALF=price_1TAbMo1a75sXZuzCQIT49F0f
STRIPE_PRICE_WORKSHOP_FULL=price_1TAbZ41a75sXZuzCkImaYTMN
STRIPE_PRICE_SYSTEMS_DESIGN=price_1TAbgY1a75sXZuzCMFdUxNCH
STRIPE_PRICE_MONTHLY_RETAINER=price_1TAbq41a75sXZuzCFhCyiVQP
STRIPE_PRICE_MEMBERSHIP_STARTER=price_1TAJb31a75sXZuzCWfnRRPET
STRIPE_PRICE_MEMBERSHIP_PRO=price_1TAJcZ1a75sXZuzC2DYQBh9r
STRIPE_PRICE_MEMBERSHIP_ELITE=price_1TAJeR1a75sXZuzCw1oSuL3r
```

**Price mismatches to decide on.** Stripe charges what Stripe says, not what the page says.
- The AI Readiness Assessment is $950 in Stripe but $750 in the site's price table.
- The 90-Day AI Roadmap is $1,500 a month in Stripe but $2,450 one-time on the site.
- CRM Audit & Cleanup and the Half-Day Executive AI Briefing are monthly in Stripe. On the site they read as one-time projects.
- The site's retainer tiers ($199, $499 and $1,299) match the three Membership prices. The "Monthly Retainer" product at $500 a month doesn't match any tier on the site.

Fix whichever side is wrong: edit the price in Stripe (create a new price and archive the old one), or edit the page.

**How to confirm.** Click a Buy button on the live site. If it fails, the Netlify function log for `create-checkout` names the bad price ID.

## 2. Bookings not reaching Google Calendar

There were three breaks between the site, Supabase and Google Calendar.

1. **Portal bookings never went to Google Calendar.** The portal's "Schedule a session" form only saved a date to the Supabase table `mgc_bookings`. Nothing created a calendar event, and it had no time to create one with. **Fixed:** the portal now shows real open times from your Google Calendar and books through the same function as /book.
2. **/book could not create the event at all.** `booking-assistant.js` added the client as a calendar guest. Google rejects that with a 403 when a service account books on a shared personal calendar without Workspace Domain-Wide Delegation, so every confirmed booking failed. **Fixed:** the event no longer adds guests. The client's name and email are in the event description, and they get the .ics file and the confirmation email.
3. **/book bookings were never saved to Supabase.** **Fixed:** every booking now writes a `mgc_bookings` row with the time (`scheduled_start`), the Google event ID (`calendar_event_id`) and the client (`client_id`, when booked from the portal). The admin page and the Slack feed now see the same appointments as the calendar.

**Still needed for Supabase saves:** `SUPABASE_SERVICE_ROLE_KEY` in Netlify must be the **secret** key from Supabase (bjnpib, Settings, API Keys, starting `sb_secret_`), set for all deploy contexts. On 2026-10-05 the server's requests were still arriving as the public role, which means that value is a publishable key or isn't set for previews.

**How to confirm.** Book a test time at /book or in the portal. It should appear in Google Calendar, and as a row in `mgc_bookings` with `calendar_event_id` filled in. If the calendar step fails, the `booking-assistant` log shows `Google Calendar 403/404: ...`. A 404 means `GOOGLE_CALENDAR_ID` is wrong, or the calendar isn't shared with the service account under "Make changes to events" (see `docs/calendar-sync-guide.md`).

## Files changed

- `netlify/functions/create-checkout.js`: billing mode now comes from the Stripe price.
- `netlify/functions/booking-assistant.js`: no guest invites, saves a `mgc_bookings` row, links portal bookings to the client.
- `dashboard.html`: the portal time picker uses live calendar slots and books through `booking-assistant`.
- `netlify/lib/leads.js`: new Supabase keys go on the `apikey` header only, as Supabase requires.
