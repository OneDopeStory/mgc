# Calendar and Booking Setup

Written for: Mark (owner). Covers the booking page at `/book`, the booking assistant function, and how Google, Apple, and Notion calendars stay in sync.

## How it fits together

- **Source of truth:** your Google Calendar. Every confirmed booking is an event on it.
- **Apple Calendar** and **Notion Calendar** read from that same Google account. You don't book into them separately.
- **Booking page** (`/book`): a chat assistant plus a time picker. Both use one server-side check, so a time can't be double-booked.
- **Rules (defaults, set in Netlify env vars):** Monday to Friday, 8:00 am to 8:00 pm Eastern, 60-minute sessions, $160, 24 hours' notice, 14 days ahead.
- **Without a connected calendar:** the page takes requests and logs them to Notion. You confirm them by hand.

## One-time setup (about 15 minutes)

1. **Share your calendar with the service account.**
   - In Google Calendar, open Settings, then your calendar, then "Share with specific people".
   - Add `mgc-global-sheets@gen-lang-client-0373250160.iam.gserviceaccount.com` with "Make changes to events".
2. **Enable the Calendar API** in Google Cloud project `gen-lang-client-0373250160` (APIs & Services > Library > Google Calendar API > Enable).
3. **Copy the calendar ID.** In calendar settings, under "Integrate calendar", copy the Calendar ID (it looks like an email address). Don't use "primary".
4. **Add Netlify environment variables** (Site configuration > Environment variables):
   - `GOOGLE_CALENDAR_ID` = the Calendar ID from step 3 (required for live booking)
   - `ANTHROPIC_API_KEY` (already used by TrueAssist; needed for the chat)
   - Optional: `BOOKING_PRICE_USD`, `BOOKING_START_HOUR`, `BOOKING_END_HOUR`, `BOOKING_TIMEZONE`, `BOOKING_MIN_NOTICE_HOURS`, `BOOKING_DAYS_AHEAD`, `BOOKING_MODEL`
   - Already set: `GOOGLE_SERVICE_ACCOUNT_KEY_B64`, `NOTION_*`, `SITE_URL`
5. **Deploy.** Deployment needs your approval first (CLAUDE.md rule).

## Test it

1. Open `https://www.mgcglobalconsulting.com/book` after deploy.
2. Pick a time, book it with a test email, and check that the event appears on your Google Calendar.
3. Confirm the Notion Deal was created with source "AI Booking Assistant (confirmed)".
4. Delete the test event.

## Sync to Apple Calendar (iPhone or Mac)

- iPhone: Settings > Calendar > Accounts > Add Account > Google. Turn on Calendars.
- Mac: System Settings > Internet Accounts > Google, then turn on Calendars.
- Each booking appears automatically. The "Download .ics" button on the confirmation card gives you a one-off file if you need it.

## Sync to Notion Calendar

- Open Notion Calendar, sign in (or add the account) with the same Google account. Google events then appear in it.

## Notes

- A time offered in the picker can still be taken by someone else in the few seconds before booking. The server re-checks the calendar and rejects the time if it's gone.
- Booking does not take payment yet. The $160 fee is shown on the page, and collection still needs a decision (Stripe checkout or invoice).
- The assistant gives no legal, tax, or credit advice. That rule is written into its instructions.
