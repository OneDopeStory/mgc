const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function portal() {
  const html = fs.readFileSync(path.resolve(__dirname, '../dashboard.html'), 'utf8');
  const source = html.slice(html.indexOf('// ── SUPABASE INIT'), html.indexOf('// Open times come'));
  const timers = []; const loaded = []; let callback; let ready; let signedOut = false;
  const context = {
    window: { supabase: { createClient: () => ({ auth: { onAuthStateChange(fn) { callback = fn; } } }) },
      addEventListener(event, fn) { if (event === 'DOMContentLoaded') ready = fn; } },
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; }, clearTimeout() {},
    renderCalendar() {}, loadScheduleSlots() {}, showAuthScreen() { signedOut = true; },
    initPortal: async user => { loaded.push(user.id); },
  };
  vm.runInNewContext(source, context); ready();
  return { loaded, emit: (event, session) => callback(event, session),
    flush: () => timers.filter(t => t.delay === 0).forEach(t => t.fn()),
    signedOut: () => signedOut };
}
test('auth callback releases its lock before loading portal data', () => {
  const p = portal();
  assert.equal(p.emit('SIGNED_IN', { user: { id: 'mock-client' } }), undefined);
  assert.deepEqual(p.loaded, []);
  p.flush(); assert.deepEqual(p.loaded, ['mock-client']);
});
test('signed-out users do not load stale queued portal data', () => {
  const p = portal();
  p.emit('SIGNED_IN', { user: { id: 'mock-client' } });
  p.emit('SIGNED_OUT', null); p.flush();
  assert.deepEqual(p.loaded, []); assert.equal(p.signedOut(), true);
});
test('refresh events do not initialize the portal twice', () => {
  const p = portal(); const session = { user: { id: 'mock-client' } };
  p.emit('INITIAL_SESSION', session); p.emit('TOKEN_REFRESHED', session); p.flush();
  assert.deepEqual(p.loaded, ['mock-client']);
});
