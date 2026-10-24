/* MGC Command Center — owner briefing.
 * Reads window.CC (set by command-center.js) and listens for cc:render.
 * Never writes data.
 *
 * This file used to also carry the mission-control hub canvas (animated
 * particle map of Slack/Forms/TrueAssist/Bookings/Invoices feeding into
 * agent nodes), a pointer spotlight on every card, and a glass-crack
 * section-change transition. Removed 2026-10-16 at the owner's request
 * ("way too big... the illustration should match the diagrams ONLY") —
 * none of it added information, it was pure spectacle on top of a
 * back-office tool. The briefing below is real: it reads live data and
 * tells the owner what needs attention. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const DAY = 864e5;
  const lc = (v) => String(v || '').toLowerCase();
  const ts = (v) => (v ? new Date(v).getTime() : 0);
  const created = (r) => ts(r.created_at);
  const usd = (c) => '$' + Math.round((c || 0) / 100).toLocaleString('en-US');
  const ago = (t) => { const h = (Date.now() - t) / 3600e3; return h < 1 ? Math.max(1, Math.round(h * 60)) + 'm' : h < 48 ? Math.round(h) + 'h' : Math.round(h / 24) + 'd'; };
  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) k === 'text' ? (n.textContent = attrs[k]) : k === 'class' ? (n.className = attrs[k]) : n.setAttribute(k, attrs[k]);
    (kids || []).forEach((c) => c != null && n.append(c));
    return n;
  }

  // ── Owner briefing: plain-language summary of what needs the owner ──
  function renderBrief() {
    const CC = window.CC; if (!CC || !$('cc-brief-list')) return;
    const st = CC.state, now = Date.now();
    const hr = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }));
    const items = [];
    const pend = (st.mgc_approvals || []).filter((a) => lc(a.status) === 'pending');
    if (pend.length) { const oldest = Math.min(...pend.map(created)); items.push([now - oldest > DAY ? 'crit' : 'warn', [el('b', { text: pend.length + ' agent request' + (pend.length > 1 ? 's' : '') }), document.createTextNode(' waiting for your approval, oldest ' + ago(oldest) + ' ago.')], 'Review', 'finance']); }
    const open = ['open', 'sent', 'overdue', 'unpaid', 'pending'];
    const overdue = (st.mgc_invoices || []).filter((r) => lc(r.status) === 'overdue' || (open.includes(lc(r.status)) && r.due_date && ts(r.due_date) < now));
    if (overdue.length) { const cents = overdue.reduce((a, r) => a + (Number(r.amount_cents) || 0), 0); items.push(['crit', [el('b', { text: usd(cents) + ' overdue' }), document.createTextNode(' across ' + overdue.length + ' invoice' + (overdue.length > 1 ? 's' : '') + '.')], 'Open', 'finance']); }
    const tasks = (st.mgc_tasks || []).filter((t) => lc(t.status) !== 'done');
    const late = tasks.filter((t) => t.due_date && ts(t.due_date) < now - DAY / 2).length, blocked = tasks.filter((t) => lc(t.status) === 'blocked').length;
    if (late || blocked) items.push(['warn', [el('b', { text: [late && late + ' overdue', blocked && blocked + ' blocked'].filter(Boolean).join(', ') }), document.createTextNode(' to-do' + (late + blocked > 1 ? 's' : '') + ' on the board.')], 'Board', 'delivery']);
    const offline = (st.mgc_staff || []).filter((s) => s.kind === 'agent' && lc(s.status) !== 'active');
    if (offline.length) items.push(['warn', [el('b', { text: offline.map((a) => a.name).join(', ') }), document.createTextNode(offline.length > 1 ? ' are paused.' : ' is paused.')], 'Agents', 'workforce']);
    const ideas = (st.mgc_intake_ideas || []).filter((i) => lc(i.status) === 'new').length;
    if (ideas) items.push(['info', [el('b', { text: ideas + ' intake' + (ideas > 1 ? 's' : '') }), document.createTextNode(' have 4 fresh ideas ready to review.')], 'Ideas', 'ideas']);
    const intakes = (st.mgc_leads || []).concat(st.mgc_questionnaires || []).filter((r) => created(r) > now - DAY).length;
    if (intakes) items.push(['info', [el('b', { text: intakes + ' new intake' + (intakes > 1 ? 's' : '') }), document.createTextNode(' in the last 24 hours.')], 'Inbox', 'inbox']);
    const urgent = items.filter((i) => i[0] !== 'info').length;
    if (!urgent) items.unshift(['ok', [el('b', { text: 'Nothing urgent.' }), document.createTextNode(' Agents and intake are running clean.')], null, null]);
    const part = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    $('cc-greet').replaceChildren(document.createTextNode(part + ', Mark. '), el('em', { text: urgent ? urgent + (urgent > 1 ? ' things need' : ' thing needs') + ' you.' : 'All clear.' }));
    const rank = { crit: 0, warn: 1, info: 2, ok: 3 };
    $('cc-brief-list').replaceChildren(...items.sort((a, b) => rank[a[0]] - rank[b[0]]).slice(0, 6).map(([sev, text, label, view]) => {
      const li = el('li', { class: 'cc-brief-item ' + sev }, [el('span', {}, text)]);
      if (label) { const b = el('button', { type: 'button', class: 'cc-act', text: label }); b.addEventListener('click', () => CC.go(view)); li.append(b); }
      return li;
    }));
    const sample = Object.values(CC.isSample).some(Boolean);
    $('cc-brief-meta').textContent = 'Updated ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET' + (CC.demo ? ' · demo data' : sample ? ' · some sample data' : ' · live data');
  }

  addEventListener('cc:render', renderBrief);

  // ── Live TrueAssist chat, inside the Welcome orb card ──
  // Local-only history, kept entirely separate from trueassist-widget.js's
  // sessionStorage keys (mgc_trueassist_history / mgc_trueassist_session) —
  // this is the admin dashboard, not the public-site widget, and the two
  // must never read or write each other's state.
  function initBriefChat() {
    const form = $('cc-chat-form'), input = $('cc-chat-input'), log = $('cc-chat-log');
    if (!form || !input || !log) return;
    const history = [];
    const sendBtn = form.querySelector('.cc-chat-send');

    function addMsg(role, text) {
      const div = el('div', { class: 'cc-chat-msg ' + role, text });
      log.append(div);
      log.scrollTop = log.scrollHeight;
      return div;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMsg('user', text);
      history.push({ role: 'user', content: text });
      if (sendBtn) sendBtn.disabled = true;
      const pending = addMsg('pending', 'Thinking...');
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });
        const data = await res.json().catch(() => ({}));
        pending.remove();
        if (!res.ok || !data.reply) throw new Error('bad response');
        addMsg('assistant', data.reply);
        history.push({ role: 'assistant', content: data.reply });
      } catch (err) {
        pending.remove();
        addMsg('error', 'Could not reach TrueAssist. If testing locally with python3 -m http.server, switch to `npx netlify dev` instead — /api/chat is CORS-locked to the production origin.');
      } finally {
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
      }
    });
  }

  initBriefChat();
})();
