'use strict';

const SERVICE_LABELS = {
  'ai-assessment': 'AI Readiness Assessment',
  'ai-roadmap': '90-Day AI Roadmap',
  'automation-starter': 'Automation Starter Pack',
  'automation-full': 'Full Automation Build',
  'crm-audit': 'CRM Audit & Cleanup',
  'crm-build': 'Full CRM Build + Training',
  'workshop-half': 'Half-Day AI Briefing',
  'workshop-full': 'Full-Day AI Bootcamp',
  'systems-design': 'Systems Design Engagement',
  'monthly-retainer': 'Monthly Retainer',
};
const TIER_LABELS = { starter: 'Starter membership', pro: 'Pro membership', elite: 'Elite membership' };
const params = new URLSearchParams(window.location.search);
const heading = document.getElementById('checkout-heading');
const message = document.getElementById('checkout-msg');
const button = document.getElementById('btn-retry');
const spinner = document.getElementById('spinner');
const errorBox = document.getElementById('error-box');
const back = document.getElementById('btn-back');
let payload = null;
let pending = false;
let savedTier = '';
try { savedTier = sessionStorage.getItem('mgc_tier') || ''; } catch { /* Storage may be disabled. */ }
const service = (params.get('service') || '').toLowerCase();
const priceId = params.get('priceId');
// Explicit service links always take precedence over a previously selected membership.
const tier = (params.get('tier') || (!service && !priceId ? savedTier : '')).toLowerCase();
let selection = '';
if ([service, priceId, tier].filter(Boolean).length === 1) {
  if (service && Object.hasOwn(SERVICE_LABELS, service)) {
    payload = { service }; selection = SERVICE_LABELS[service];
  } else if (tier && Object.hasOwn(TIER_LABELS, tier)) {
    payload = { tier }; selection = TIER_LABELS[tier]; back.href = '/membership';
    back.textContent = 'Back to memberships';
  } else if (priceId && /^price_[A-Za-z0-9]+$/.test(priceId)) {
    payload = { priceId }; selection = 'Your selected service';
  }
}
spinner.style.display = 'none';
if (payload) {
  const badge = document.createElement('div');
  badge.className = 'tier-badge'; badge.textContent = selection;
  const wrap = document.getElementById('tier-badge-wrap');
  wrap.replaceChildren(badge); wrap.style.display = 'block';
  heading.textContent = params.get('cancelled') === 'true' ? 'Payment not completed' : 'Review your selection';
  message.textContent = 'Continue to Stripe to review the final price and enter your payment details.';
  button.textContent = 'Continue to secure payment';
  button.style.display = 'inline-block';
} else {
  heading.textContent = 'Choose your service';
  message.textContent = 'Select a service or membership before continuing to secure payment.';
  back.textContent = 'Browse services';
}

async function startCheckout() {
  if (!payload || pending) return;
  pending = true; button.disabled = true; button.textContent = 'Connecting securely…';
  spinner.style.display = 'block'; errorBox.style.display = 'none';
  document.getElementById('error-icon').style.display = 'none';
  heading.textContent = 'Opening secure checkout';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error('Checkout unavailable');
    const destination = new URL(data.url);
    if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') {
      throw new Error('Unexpected checkout destination');
    }
    try { sessionStorage.removeItem('mgc_tier'); } catch { /* Optional storage only. */ }
    window.location.assign(destination.href);
  } catch (error) {
    heading.textContent = 'We couldn’t open checkout';
    errorBox.textContent = error.name === 'AbortError'
      ? 'The connection timed out. Please try again or contact us for help.'
      : 'Online payment is temporarily unavailable. Please try again or contact us to arrange payment.';
    errorBox.style.display = 'block';
    document.getElementById('error-icon').style.display = 'flex';
    button.textContent = 'Try again';
  } finally {
    clearTimeout(timeout); pending = false; button.disabled = false; spinner.style.display = 'none';
  }
}
button.addEventListener('click', startCheckout);
