-- Adds a "which of MGC's 6 services is this about" field to mgc_bookings,
-- distinct from the existing `service` column (which holds session/call type:
-- strategy / review / onboarding / urgent, set by dashboard.html's Schedule form).
-- Rerunnable — safe to run multiple times.

alter table mgc_bookings add column if not exists service_line text;

comment on column mgc_bookings.service_line is
  'Which MGC service this booking is about (e.g. "AI Consulting & Strategy"), set by the dashboard Schedule form''s service-line selector. Distinct from `service`, which is session/call type.';
