const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function backend(env = {}, recurring = false) {
  const calls = [];
  function Stripe() {
    return {
      prices: { retrieve: async id => ({ id, active: true, recurring: recurring ? {} : null }) },
      checkout: { sessions: { create: async options => {
        calls.push(options); return { id: 'cs_test_mock', url: 'https://checkout.stripe.com/c/pay/mock' };
      } } },
    };
  }
  const context = { exports: {}, require: () => Stripe, process: { env }, URL, URLSearchParams, console };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'netlify/functions/create-checkout.js'), 'utf8'), context);
  return { calls, request: body => context.exports.handler({ httpMethod: 'POST', body: JSON.stringify(body) }) };
}

test('unconfigured payments return a controlled error without creating a session', async () => {
  const b = backend();
  assert.equal((await b.request({ service: 'ai-assessment' })).statusCode, 503);
  assert.equal(b.calls.length, 0);
});
test('reject arbitrary prices, malformed selectors and prototype keys', async () => {
  const b = backend({ STRIPE_SECRET_KEY: 'test_mock', STRIPE_PRICE_AI_CONSULTING_ASSESSMENT: 'price_allowed' });
  for (const body of [null, [], { service: 1 }, { tier: 'constructor' }, { service: '__proto__' },
    { priceId: 'price_other' }, { service: 'ai-assessment', tier: 'starter' }, { service: 'ai-assessment', metadata: null }]) {
    assert.equal((await b.request(body)).statusCode, 400);
  }
  assert.equal(b.calls.length, 0);
});
test('missing Stripe key does not crash handler initialization', async () => {
  const b = backend({ STRIPE_PRICE_AI_CONSULTING_ASSESSMENT: 'price_allowed' });
  assert.equal((await b.request({ service: 'ai-assessment' })).statusCode, 503);
});
test('retainer legacy configuration works and Stripe controls recurring mode', async () => {
  const b = backend({ STRIPE_SECRET_KEY: 'test_mock', STRIPE_PRICE_RETAINER: 'price_retainer' }, true);
  assert.equal((await b.request({ service: 'monthly-retainer', mode: 'payment' })).statusCode, 200);
  assert.equal(b.calls[0].mode, 'subscription');
  assert.equal(b.calls[0].line_items[0].price, 'price_retainer');
  const cancel = new URL(b.calls[0].cancel_url);
  assert.equal(cancel.searchParams.get('service'), 'monthly-retainer');
  assert.equal(cancel.searchParams.get('cancelled'), 'true');
  assert.match(b.calls[0].success_url, /^https:\/\/mgcglobalconsulting.com\/thank-you\?/);
});

function frontend(search, savedTier = '', response = { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/mock' }) }) {
  const elements = new Map(); const requests = []; const destinations = [];
  const element = id => {
    if (!elements.has(id)) elements.set(id, { style: {}, textContent: '', replaceChildren() {}, addEventListener(type, cb) { this[type] = cb; } });
    return elements.get(id);
  };
  const context = {
    document: { getElementById: element, createElement: () => ({}) },
    window: { location: { search, assign: value => destinations.push(value) } },
    sessionStorage: { getItem: () => savedTier, removeItem() {} }, URL, URLSearchParams, AbortController,
    setTimeout: () => 1, clearTimeout() {},
    fetch: async (url, options) => { requests.push(JSON.parse(options.body)); return response; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/checkout.js'), 'utf8'), context);
  return { element, requests, destinations, start: () => context.startCheckout() };
}
test('service selection overrides stale membership and waits for a click', async () => {
  const f = frontend('?service=crm-audit', 'elite');
  assert.equal(f.requests.length, 0);
  await f.start();
  assert.deepEqual(f.requests, [{ service: 'crm-audit' }]);
  assert.equal(f.destinations.length, 1);
});
test('empty or invalid selection never starts payment', async () => {
  for (const search of ['', '?service=unknown', '?service=crm-audit&tier=elite']) {
    const f = frontend(search); await f.start(); assert.equal(f.requests.length, 0);
  }
});
test('cancelled payment retains selection and can be retried deliberately', async () => {
  const f = frontend('?tier=pro&cancelled=true');
  assert.equal(f.requests.length, 0);
  assert.equal(f.element('checkout-heading').textContent, 'Payment not completed');
  await f.start(); assert.deepEqual(f.requests, [{ tier: 'pro' }]);
});
test('failed backend presents recovery without a blocking alert', async () => {
  const f = frontend('?service=crm-audit', '', { ok: false, json: async () => ({ error: 'Unavailable' }) });
  await f.start();
  assert.equal(f.element('error-box').style.display, 'block');
  assert.equal(f.element('spinner').style.display, 'none');
  assert.equal(f.element('btn-retry').disabled, false);
});
test('unexpected payment destinations are rejected', async () => {
  const f = frontend('?tier=pro', '', { ok: true, json: async () => ({ url: 'https://example.com/payment' }) });
  await f.start(); assert.equal(f.destinations.length, 0);
});
