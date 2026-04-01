'use strict';
/**
 * MGC Consulting OS — HubSpot Breeze Integration Bridge
 * ──────────────────────────────────────────────────────
 * Handles:
 *   1. HubSpot form submission events (hsFormCallback)
 *   2. Tally form submission forwarding to HubSpot via API
 *   3. Self-Reported Challenge field normalization for Breeze Data Agent
 *   4. Calendly booking sync to HubSpot contact
 *   5. Page-view intent signaling for Breeze scoring
 *
 * Install: <script src="/hs-breeze-bridge.js" defer></script>
 * Requires: HubSpot tracking code already on page (loads _hsq)
 */

/* ── Config ─────────────────────────────────────────────────────────── */
const MGC_HS = {
  portalId:        '245294674',
  formGuid:        '684849da-7a7f-4f76-a36e-eb6511556721',
  challengeField:  'mgc_self_reported_challenge',
  serviceField:    'mgc_service_interest',
  intentField:     'mgc_page_intent',
  // Tally form ID (from embed URL)
  tallyFormId:     'pbLEaP',
};

/* ── HubSpot analytics queue ────────────────────────────────────────── */
const _hsq = window._hsq = window._hsq || [];

/* ══════════════════════════════════════════════════════════════════════
   1. PAGE-VIEW INTENT SIGNALING
   Tells Breeze which service page the contact was viewing
   ══════════════════════════════════════════════════════════════════════ */
(function signalPageIntent() {
  const intentMap = {
    'ai-consulting':    'AI Strategy & Consulting',
    'automation':       'Business Automation',
    'crm-optimization': 'CRM Optimization',
    'systems-design':   'Systems Design',
    'ai-workshops':     'AI Workshops & Training',
    'retainer-support': 'Retainer & Ongoing Support',
    'membership':       'MGC Membership',
  };

  const slug = location.pathname.replace(/^\/|\.html$/g, '');
  const intent = intentMap[slug];

  if (intent) {
    // Set contact property so Breeze can score engagement by service
    _hsq.push(['identify', { [MGC_HS.intentField]: intent }]);
    _hsq.push(['trackPageView']);

    // Store locally for form pre-population
    sessionStorage.setItem('mgc_page_intent', intent);
    sessionStorage.setItem('mgc_service_slug', slug);
  }
})();

/* ══════════════════════════════════════════════════════════════════════
   2. HUBSPOT NATIVE FORM HANDLER
   Fires after any HubSpot embedded form submits
   ══════════════════════════════════════════════════════════════════════ */
window.addEventListener('message', function handleHsFormEvent(e) {
  if (e.data.type !== 'hsFormCallback') return;

  const { eventName, id, data } = e.data;

  if (eventName === 'onFormSubmit') {
    const formData = normalizeFormPayload(data);
    console.debug('[MGC-HS] Form submitted:', id, formData);
    _hsq.push(['identify', formData]);
    _hsq.push(['trackEvent', {
      id: 'mgc_form_submit',
      value: formData[MGC_HS.challengeField] || 'unknown',
    }]);
  }

  if (eventName === 'onFormReady') {
    prefillFromSession(id);
  }
});

/* ══════════════════════════════════════════════════════════════════════
   3. TALLY FORM SUBMISSION → HUBSPOT
   Intercepts Tally postMessage and forwards to HubSpot Forms API
   ══════════════════════════════════════════════════════════════════════ */
window.addEventListener('message', async function handleTallySubmit(e) {
  if (
    e.origin !== 'https://tally.so' ||
    e.data?.event !== 'Tally.FormSubmitted' ||
    e.data?.formId !== MGC_HS.tallyFormId
  ) return;

  const raw    = e.data.payload?.fields || [];
  const mapped = mapTallyToHubSpot(raw);

  console.debug('[MGC-HS] Tally submit intercepted, forwarding to HubSpot', mapped);

  try {
    await pushToHubSpot(mapped);
  } catch (err) {
    console.error('[MGC-HS] HubSpot push failed:', err.message);
  }
});

/* ══════════════════════════════════════════════════════════════════════
   4. CALENDLY BOOKING → HUBSPOT CONTACT UPDATE
   ══════════════════════════════════════════════════════════════════════ */
window.addEventListener('message', function handleCalendlyEvent(e) {
  if (e.origin !== 'https://calendly.com') return;
  if (e.data?.event !== 'calendly.event_scheduled') return;

  const { invitee } = e.data.payload;
  if (!invitee?.email) return;

  _hsq.push(['identify', {
    email:                    invitee.email,
    firstname:                invitee.name?.split(' ')[0] || '',
    lastname:                 invitee.name?.split(' ').slice(1).join(' ') || '',
    mgc_calendly_booked:      'true',
    mgc_booking_date:         new Date().toISOString(),
    hs_lead_status:           'IN_PROGRESS',
    lifecyclestage:           'lead',
  }]);

  _hsq.push(['trackEvent', { id: 'mgc_calendly_booking' }]);
  console.debug('[MGC-HS] Calendly booking synced to HubSpot');
});

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Normalize the Self-Reported Challenge field for Breeze Data Agent.
 * Breeze reads this as a taxonomy signal — keep values consistent.
 */
function normalizeFormPayload(fields) {
  const out = {};
  (fields || []).forEach(({ name, value }) => {
    out[name] = value;
  });

  // Normalize challenge field to controlled vocabulary
  if (out[MGC_HS.challengeField]) {
    out[MGC_HS.challengeField] = normalizeChallengeValue(out[MGC_HS.challengeField]);
  }

  // Inject session-stored intent if not already in form
  if (!out[MGC_HS.serviceField]) {
    out[MGC_HS.serviceField] = sessionStorage.getItem('mgc_page_intent') || '';
  }

  return out;
}

/**
 * Map freeform challenge text → controlled Breeze taxonomy values.
 */
function normalizeChallengeValue(raw) {
  const map = {
    'manual':     'manual_ops',
    'repetitive': 'manual_ops',
    'crm':        'crm_chaos',
    'hubspot':    'crm_chaos',
    'notion':     'crm_chaos',
    'automat':    'no_automation',
    'zapier':     'no_automation',
    'ai':         'ai_readiness',
    'artificial': 'ai_readiness',
    'data':       'data_silos',
    'silo':       'data_silos',
    'scal':       'scaling_ops',
    'grow':       'scaling_ops',
  };
  const lower = raw.toLowerCase();
  for (const [keyword, value] of Object.entries(map)) {
    if (lower.includes(keyword)) return value;
  }
  return raw; // pass through if no match — Breeze will classify
}

/**
 * Map Tally field array to HubSpot property keys.
 * Update field labels to match your Tally form questions.
 */
function mapTallyToHubSpot(fields) {
  const labelToHsKey = {
    'First Name':         'firstname',
    'Last Name':          'lastname',
    'Email':              'email',
    'Phone':              'phone',
    'Company':            'company',
    'Business Challenge': MGC_HS.challengeField,
    'Service Interest':   MGC_HS.serviceField,
    'Message':            'message',
    'How did you hear':   'mgc_lead_source_detail',
  };

  const payload = { lifecyclestage: 'lead' };
  fields.forEach(({ label, value }) => {
    const key = labelToHsKey[label];
    if (key && value) {
      payload[key] = label === 'Business Challenge'
        ? normalizeChallengeValue(String(value))
        : String(value);
    }
  });

  // Inject page intent
  const intent = sessionStorage.getItem('mgc_page_intent');
  if (intent) payload[MGC_HS.serviceField] = payload[MGC_HS.serviceField] || intent;

  return payload;
}

/**
 * POST contact data to HubSpot Forms v3 API (client-side, no server needed).
 * Uses portalId + formGuid from config above.
 */
async function pushToHubSpot(contactData) {
  const { email, ...fields } = contactData;
  if (!email) throw new Error('email required for HubSpot push');

  const body = {
    fields: [
      { objectTypeId: '0-1', name: 'email', value: email },
      ...Object.entries(fields).map(([name, value]) => ({
        objectTypeId: '0-1', name, value: String(value),
      })),
    ],
    context: {
      pageUri:  location.href,
      pageName: document.title,
      hutk:     getCookie('hubspotutk'),
    },
    legalConsentOptions: {
      consent: {
        consentToProcess: true,
        text: 'I agree to receive communications from MGC Global Consulting.',
        communications: [{ value: true, subscriptionTypeId: 999, text: 'Marketing emails' }],
      },
    },
  };

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${MGC_HS.portalId}/${MGC_HS.formGuid}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HubSpot API ${res.status}: ${JSON.stringify(err)}`);
  }

  console.debug('[MGC-HS] Contact pushed to HubSpot successfully');
  return res.json();
}

/**
 * Pre-fill HubSpot form fields from session storage on form ready.
 */
function prefillFromSession(formId) {
  const intent = sessionStorage.getItem('mgc_page_intent');
  if (!intent) return;
  const form = document.querySelector(`[data-hs-form="${formId}"]`);
  if (!form) return;
  const serviceInput = form.querySelector(`[name="${MGC_HS.serviceField}"]`);
  if (serviceInput) serviceInput.value = intent;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}
