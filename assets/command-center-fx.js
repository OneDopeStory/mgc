/* MGC Command Center — effects layer: live integration hub, owner briefing,
 * glass-crack section change, pointer spotlight. Reads window.CC (set by command-center.js)
 * and listens to cc:event / cc:render / cc:view. Never writes data. */
(function () {
  'use strict';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  // ── Pointer spotlight on glass panes ──
  addEventListener('pointermove', (e) => {
    const c = e.target.closest && e.target.closest('.cc-card, .cc-kpi');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px');
    c.style.setProperty('--my', e.clientY - r.top + 'px');
  }, { passive: true });

  // ── Section change: glass crack from the click point, panes slide in ──
  let lastPoint = null;
  addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('#cc-nav button, [data-go]')) lastPoint = [e.clientX, e.clientY]; }, true);
  function crack(x, y) {
    const c = el('canvas', { class: 'cc-crack', 'aria-hidden': 'true' });
    document.body.append(c);
    const dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lines = [], reach = Math.hypot(W, H) * 0.55;
    for (let i = 0; i < 13; i++) {
      let a = (i / 13) * Math.PI * 2 + Math.random() * 0.3, px = x, py = y, len = 0;
      const pts = [[px, py]], max = reach * (0.45 + Math.random() * 0.55);
      while (len < max) { const s = 18 + Math.random() * 40; a += (Math.random() - 0.5) * 0.5; px += Math.cos(a) * s; py += Math.sin(a) * s; len += s; pts.push([px, py]);
        if (Math.random() < 0.22) { const b = a + (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.6); lines.push([[px, py], [px + Math.cos(b) * 50, py + Math.sin(b) * 50]]); } }
      lines.push(pts);
    }
    const start = performance.now(), dur = 560;
    (function frame(t) {
      const k = Math.min(1, (t - start) / dur);
      g.clearRect(0, 0, W, H);
      const flash = g.createRadialGradient(x, y, 0, x, y, 220);
      flash.addColorStop(0, `rgba(184,216,240,${0.35 * (1 - k)})`); flash.addColorStop(1, 'rgba(0,212,255,0)');
      g.fillStyle = flash; g.fillRect(0, 0, W, H);
      g.globalAlpha = 1 - k; g.lineWidth = 1.1; g.strokeStyle = '#E6F4FF'; g.shadowColor = '#00D4FF'; g.shadowBlur = 8;
      const grow = Math.min(1, k * 4);
      lines.forEach((pts) => { const n = Math.max(2, Math.ceil(pts.length * grow)); g.beginPath(); pts.slice(0, n).forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); });
      g.globalAlpha = 1;
      if (k < 1) requestAnimationFrame(frame); else c.remove();
    })(start);
  }
  function enterPanes(view) {
    const sec = document.querySelector(`.cc-view[data-view="${view}"]`);
    if (!sec) return;
    let i = 0;
    sec.querySelectorAll(':scope > *, :scope > .cc-grid > *').forEach((n) => { if (!n.classList.contains('cc-grid')) n.style.setProperty('--i', i++); });
    sec.classList.remove('cc-enter'); void sec.offsetWidth; sec.classList.add('cc-enter');
    setTimeout(() => sec.classList.remove('cc-enter'), 1400);
  }
  addEventListener('cc:view', (e) => {
    if (REDUCED) return;
    if (lastPoint) { crack(lastPoint[0], lastPoint[1]); lastPoint = null; }
    enterPanes(e.detail.view);
  });

  // ── Live integration hub ──
  const SRC = [
    { key: 'slack', name: 'Slack', color: '#A78BFA', icon: 'M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z' },
    { key: 'form', name: 'Forms', color: '#FFB347', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm2 16H8v-2h8v2Zm0-4H8v-2h8v2Zm-3-5V3.5L18.5 9H13Z' },
    { key: 'chat', name: 'TrueAssist', color: '#00D4FF', icon: 'M12 2 9.5 8.5 3 11l6.5 2.5L12 20l2.5-6.5L21 11l-6.5-2.5L12 2Z' },
    { key: 'booking', name: 'Bookings', color: '#0099FF', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10Z' },
    { key: 'invoice', name: 'Invoices', color: '#22C55E', icon: 'M11.8 10.9c-2.3-.6-3-1.2-3-2.1 0-1.1 1-1.9 2.7-1.9 1.8 0 2.4.8 2.5 2.1h2.2c-.1-1.7-1.1-3.3-3.2-3.8V3h-3v2.2C8.1 5.6 6.5 6.9 6.5 8.8c0 2.3 1.9 3.4 4.6 4.1 2.5.6 3 1.5 3 2.4 0 .7-.5 1.8-2.7 1.8-2.1 0-2.9-.9-3-2.1H6.2c.1 2.2 1.8 3.5 3.8 3.9V21h3v-2.1c1.9-.4 3.5-1.5 3.5-3.6 0-2.8-2.4-3.8-4.7-4.4Z' },
  ].map((s) => Object.assign(s, { path: new Path2D(s.icon), flash: 0, today: 0, kind: 'src' }));
  let agents = [];
  const logo = new Image(); logo.src = 'assets/mgc-logo-transparent.png';
  const hub = { x: 0, y: 0, r: 34, ring: 0 };
  let W = 0, H = 0, dpr = 1, particles = [], fibers = [], canvas, g, vertical = false;

  function layout() {
    const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; dpr = devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    vertical = W < 560;
    hub.x = W / 2; hub.y = H / 2; hub.r = vertical ? 28 : 36;
    const place = (list, side) => list.forEach((n, i) => {
      const f = list.length === 1 ? 0.5 : i / (list.length - 1);
      if (vertical) { n.x = 28 + f * (W - 56); n.y = side < 0 ? 34 : H - 40; }
      else { n.x = side < 0 ? 58 : W - 58; n.y = 34 + f * (H - 76); }
    });
    place(SRC, -1); place(agents, 1);
    fibers = SRC.concat(agents).map((n) => {
      const strands = [];
      for (let k = 0; k < 5; k++) {
        const o = (k - 2) * 5;
        const c1 = vertical ? [n.x + o, (n.y + hub.y) / 2] : [(n.x + hub.x) / 2, n.y + o];
        const c2 = vertical ? [hub.x + o * 0.4, (n.y + hub.y) / 2] : [(n.x + hub.x) / 2, hub.y + o * 0.4];
        strands.push([[n.x, n.y], c1, c2, [hub.x, hub.y]]);
      }
      return { node: n, strands };
    });
  }
  const bez = (p, t) => { const u = 1 - t; return [0, 1].map((i) => u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]); };
  function emit(node, n, outward) {
    const f = fibers.find((x) => x.node === node); if (!f) return;
    node.flash = 1;
    for (let i = 0; i < n; i++) particles.push({ f, s: f.strands[(Math.random() * 5) | 0], t: -i * 0.06, v: 0.008 + Math.random() * 0.006, out: !!outward, color: node.color });
  }
  function nodeFor(table, row) {
    const CC = window.CC; const by = (k) => SRC.find((s) => s.key === k);
    if (table === 'mgc_leads') return [by(CC.leadSrc(row)), 0];
    if (table === 'mgc_questionnaires') return [by('form'), 0];
    if (table === 'mgc_bookings') return [by('booking'), 0];
    if (table === 'mgc_invoices') return [by('invoice'), 0];
    if (table === 'mgc_agent_events' && CC.isSlack(row)) return [by('slack'), 0];
    if (table === 'mgc_agent_events' || table === 'mgc_approvals') { const a = agents.find((x) => lc(x.name) === lc(row.agent)); return [a || agents[0], table === 'mgc_agent_events' ? 1 : 0]; }
    return [null];
  }
  function drawNode(n) {
    const s = vertical ? 34 : 40, x = n.x - s / 2, y = n.y - s / 2, f = n.flash;
    g.save();
    g.shadowColor = n.color; g.shadowBlur = 14 + f * 26;
    if (n.kind === 'agent') {
      g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; g.lineTo(n.x + Math.cos(a) * s * 0.56, n.y + Math.sin(a) * s * 0.56); } g.closePath();
      const m = g.createLinearGradient(x, y, x + s, y + s); m.addColorStop(0, '#E8F1FA'); m.addColorStop(0.38, '#8FA6BC'); m.addColorStop(0.52, '#3D5167'); m.addColorStop(0.7, '#AFC3D6'); m.addColorStop(1, '#5E7489');
      g.fillStyle = m; g.fill(); g.shadowBlur = 0;
      g.fillStyle = '#010C1A'; g.font = `800 ${vertical ? 10 : 11}px Raleway, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(n.short, n.x, n.y + 1);
      if (n.live) { g.fillStyle = '#22C55E'; g.beginPath(); g.arc(n.x + s * 0.42, n.y - s * 0.38, 3.5, 0, 7); g.fill(); }
    } else {
      const r = 10; g.beginPath(); g.roundRect(x, y, s, s, r);
      const bg = g.createLinearGradient(x, y, x, y + s); bg.addColorStop(0, rgba(n.color, 0.38 + f * 0.4)); bg.addColorStop(1, rgba(n.color, 0.12 + f * 0.2));
      g.fillStyle = bg; g.fill(); g.shadowBlur = 0; g.strokeStyle = rgba('#B8D8F0', 0.35); g.lineWidth = 1; g.stroke();
      g.translate(n.x - 9, n.y - 9); g.scale(0.75, 0.75); g.fillStyle = '#fff'; g.fill(n.path);
    }
    g.restore();
    g.font = '500 10px "JetBrains Mono", monospace'; g.textBaseline = 'alphabetic';
    const lx = vertical ? n.x : n.kind === 'agent' ? n.x - s / 2 - 8 : n.x + s / 2 + 8, ly = vertical ? (n.kind === 'agent' ? n.y + s / 2 + 13 : n.y - s / 2 - 6) : n.y + 4;
    g.textAlign = vertical ? 'center' : n.kind === 'agent' ? 'right' : 'left';
    g.fillStyle = 'rgba(180,215,240,.6)';
    if (!vertical) g.fillText(n.label, lx, ly - 7);
    g.fillStyle = '#fff'; g.font = '600 11px "JetBrains Mono", monospace';
    g.fillText(vertical ? n.count : n.count, lx, vertical ? ly : ly + 7);
  }
  function draw(t) {
    g.clearRect(0, 0, W, H);
    // fibers
    fibers.forEach(({ node, strands }) => strands.forEach((p, k) => {
      g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
      g.strokeStyle = rgba(node.color, k === 2 ? 0.22 + node.flash * 0.3 : 0.07 + node.flash * 0.1); g.lineWidth = k === 2 ? 1.2 : 0.8; g.stroke();
    }));
    // particles: colored at the source, warming to gold as they reach MGC (the graphics' light streams)
    particles = particles.filter((q) => q.t < 1);
    particles.forEach((q) => {
      q.t += q.v; if (q.t < 0) return;
      const tt = q.out ? 1 - q.t : q.t, [x, y] = bez(q.s, tt);
      const warm = q.out ? 0 : Math.max(0, (q.t - 0.55) / 0.45);
      const col = warm > 0.5 ? '#FFB347' : q.color;
      g.save(); g.shadowColor = col; g.shadowBlur = 12; g.fillStyle = warm > 0.5 ? '#FFE2B0' : '#fff';
      g.beginPath(); g.arc(x, y, 1.8 + warm, 0, 7); g.fill();
      const [bx, by] = bez(q.s, Math.max(0, q.out ? tt + 0.05 : tt - 0.05));
      g.strokeStyle = rgba(col, 0.6); g.lineWidth = 1.6; g.beginPath(); g.moveTo(bx, by); g.lineTo(x, y); g.stroke(); g.restore();
      if (!q.out && q.t + q.v >= 1) hub.ring = 1;
    });
    // hub: orbit rings, gold core, logo
    const R = hub.r, spin = (t || 0) / 4000;
    g.save(); g.translate(hub.x, hub.y);
    const core = g.createRadialGradient(0, 0, 0, 0, 0, R * 2.6); core.addColorStop(0, `rgba(255,179,71,${0.28 + hub.ring * 0.3})`); core.addColorStop(0.35, 'rgba(0,102,255,.18)'); core.addColorStop(1, 'rgba(0,102,255,0)');
    g.fillStyle = core; g.beginPath(); g.arc(0, 0, R * 2.6, 0, 7); g.fill();
    [[1.45, 0.35, 1], [1.8, 0.55, -0.7], [2.15, 0.25, 0.45]].forEach(([k, tilt, dir]) => {
      g.save(); g.rotate(spin * dir); g.scale(1, tilt + 0.4); g.strokeStyle = 'rgba(0,187,255,.35)'; g.lineWidth = 1; g.setLineDash([2, 6]);
      g.beginPath(); g.arc(0, 0, R * k, 0, 7); g.stroke(); g.restore();
    });
    g.setLineDash([]);
    if (hub.ring > 0.01) { g.strokeStyle = `rgba(255,179,71,${hub.ring})`; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R + (1 - hub.ring) * 26, 0, 7); g.stroke(); }
    g.shadowColor = '#00D4FF'; g.shadowBlur = 24;
    const disc = g.createLinearGradient(-R, -R, R, R); disc.addColorStop(0, '#0A3A6B'); disc.addColorStop(1, '#010C1A');
    g.fillStyle = disc; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(184,216,240,.5)'; g.lineWidth = 1.2; g.stroke();
    if (logo.complete && logo.naturalWidth) g.drawImage(logo, -R * 0.82, -R * 0.82, R * 1.64, R * 1.64);
    g.restore();
    SRC.concat(agents).forEach((n) => { drawNode(n); n.flash *= 0.94; });
    hub.ring *= 0.93;
  }
  let last = 0, trickle = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    if (!canvas.offsetParent || t - last < 30) return;
    last = t;
    // ambient trickle, weighted by each source's activity today
    if (t - trickle > 1100) {
      trickle = t;
      const pool = SRC.flatMap((s) => Array(Math.min(6, 1 + s.today)).fill(s)).concat(agents);
      const n = pool[(Math.random() * pool.length) | 0];
      const f = n && fibers.find((x) => x.node === n);
      if (f) { particles.push({ f, s: f.strands[2], t: 0, v: 0.007, out: n.kind === 'agent', color: n.color }); }
    }
    draw(t);
  }
  function refreshData() {
    const CC = window.CC; if (!CC || !canvas) return;
    const st = CC.state, t0 = Date.now() - DAY;
    const today = (rows) => rows.filter((r) => created(r) > t0).length;
    const leads = st.mgc_leads || [];
    const counts = {
      slack: today((st.mgc_agent_events || []).filter(CC.isSlack)),
      form: today(leads.filter((l) => CC.leadSrc(l) === 'form')) + today(st.mgc_questionnaires || []),
      chat: today(leads.filter((l) => CC.leadSrc(l) === 'chat')),
      booking: today(st.mgc_bookings || []),
      invoice: today(st.mgc_invoices || []),
    };
    SRC.forEach((s) => { s.today = counts[s.key]; s.label = s.name.toUpperCase(); s.count = s.today + ' today'; });
    const roster = (st.mgc_staff || []).filter((s) => s.kind === 'agent').slice(0, 5);
    const prev = agents;
    agents = roster.map((a) => {
      const old = prev.find((p) => p.name === a.name) || {};
      const evs = (st.mgc_agent_events || []).filter((e) => e.agent === a.name);
      const lastT = Math.max(ts(a.last_heartbeat_at), ...evs.map(created), 0);
      return Object.assign(old, { kind: 'agent', name: a.name, color: '#2DD4BF', flash: old.flash || 0, short: a.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
        label: a.name.replace(/ Agent$/, '').toUpperCase(), live: lc(a.status) === 'active' && lastT > Date.now() - 15 * 60e3,
        count: evs.filter((e) => created(e) > t0).length + ' runs' });
    });
    if (prev.length !== agents.length || !fibers.length) layout();
    const cap = $('cc-hub-caption');
    if (cap && !cap.childElementCount) cap.append(...SRC.map((s) => el('span', {}, [el('i', { style: `background:${s.color}` }), document.createTextNode(s.name)])),
      el('span', {}, [el('i', { style: 'background:#8FA6BC' }), document.createTextNode('Agents')]), el('span', {}, [el('i', { style: 'background:#FFB347' }), document.createTextNode('Arriving at MGC')]));
    const card = canvas.closest('.cc-card'), sample = ['mgc_leads', 'mgc_agent_events', 'mgc_bookings'].some((t) => CC.isSample[t]);
    let tag = card.querySelector(':scope > .cc-sample-tag');
    if (sample && !tag) card.prepend(el('span', { class: 'cc-sample-tag', text: 'SAMPLE' })); else if (!sample && tag) tag.remove();
    if (REDUCED) draw(0);
  }
  function initHub() {
    canvas = $('cc-hub'); if (!canvas) return;
    g = canvas.getContext('2d');
    if (!g.roundRect) g.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
    new ResizeObserver(() => { layout(); if (REDUCED) draw(0); }).observe(canvas);
    refreshData(); layout();
    if (!REDUCED) requestAnimationFrame(loop); else draw(0);
  }
  addEventListener('cc:event', (e) => {
    if (!canvas) return;
    const { table, row } = e.detail;
    const [node, out] = nodeFor(table, row || {});
    if (node) emit(node, table === 'mgc_invoices' || table === 'mgc_leads' ? 8 : 5, out);
    else hub.ring = Math.max(hub.ring, 0.5);
  });

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

  let ready = false;
  addEventListener('cc:render', () => {
    if (!ready) { ready = true; initHub(); }
    refreshData(); renderBrief();
  });
})();
