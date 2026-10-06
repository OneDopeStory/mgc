/* MGC interactive hero globe (replaces the hero video).
 * A glass globe with a service ring and six orbiting service nodes.
 * Drag to spin, hover or focus a node to inspect it, tap or Enter to open its page.
 * The chip underneath is a carousel: it cycles the services and turns the globe to face each one. */
(function () {
  'use strict';
  const canvas = document.getElementById('hero-globe');
  if (!canvas) return;
  const box = canvas.parentElement, tip = document.getElementById('globe-tip');
  const carLink = document.getElementById('globe-car-link'), carName = carLink.querySelector('b');
  const g = canvas.getContext('2d');
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2, TILT = -0.42;
  const SERVICES = [
    { name: 'AI Strategy & Consulting', tag: 'Roadmaps tied to EBIT', href: 'ai-consulting.html', gold: false },
    { name: 'Automation Architecture', tag: 'Workflows that run themselves', href: 'automation.html', gold: true },
    { name: 'CRM Optimization', tag: 'One pipeline you can trust', href: 'crm-optimization.html', gold: false },
    { name: 'Systems Design', tag: 'Custom / Enterprise', href: 'systems-design.html', gold: true },
    { name: 'AI Workshops', tag: 'Hands-on team training', href: 'ai-workshops.html', gold: false },
    { name: 'Retainer & Support', tag: 'From $199/mo', href: 'retainer-support.html', gold: true },
  ].map((s, i) => Object.assign(s, { ang: (i / 6) * TAU, h: [0.35, -0.25, 0.5, -0.45, 0.15, -0.05][i], orbit: [1.42, 1.3, 1.36, 1.46, 1.28, 1.4][i] }));

  let W = 0, R = 0, dpr = 1, yaw = 0.4, vel = 0, featured = 0, hover = -1, visible = true;
  let dragging = false, lastX = 0, moved = 0, idleUntil = 0;
  const DOTS = Array.from({ length: 280 }, (_, i) => { const k = i + 0.5, phi = Math.acos(1 - 2 * k / 280), th = Math.PI * (1 + Math.sqrt(5)) * k; return [Math.cos(th) * Math.sin(phi), Math.cos(phi), Math.sin(th) * Math.sin(phi)]; });

  function size() {
    const r = canvas.getBoundingClientRect(); W = r.width; dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = W * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); R = W * 0.33;
    if (REDUCED) draw();
  }
  // rotate by yaw around Y, then tilt around X; returns screen x, y and depth z (toward viewer > 0)
  function proj(x, y, z) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const ct = Math.cos(TILT), st = Math.sin(TILT), y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
    return [W / 2 + x1 * R, W / 2 - y2 * R, z2];
  }
  const nodePos = (s) => { const o = s.orbit; return [Math.cos(s.ang) * o, s.h, Math.sin(s.ang) * o]; };

  function ringSeg(front) { // the service band around the globe, split into six coloured segments
    const r1 = 1.12, r2 = 1.3, steps = 18;
    SERVICES.forEach((s, i) => {
      const a0 = s.ang - TAU / 12 + 0.03, a1 = s.ang + TAU / 12 - 0.03;
      const outer = [], inner = [];
      for (let k = 0; k <= steps; k++) { const a = a0 + (a1 - a0) * k / steps; outer.push(proj(Math.cos(a) * r2, 0, Math.sin(a) * r2)); inner.push(proj(Math.cos(a) * r1, 0, Math.sin(a) * r1)); }
      const z = outer[steps >> 1][2]; if ((z > 0) !== front) return;
      const lit = i === featured || i === hover;
      g.beginPath(); outer.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); inner.reverse().forEach((p) => g.lineTo(p[0], p[1])); g.closePath();
      g.fillStyle = s.gold ? `rgba(255,179,71,${lit ? 0.42 : 0.2})` : `rgba(0,153,255,${lit ? 0.45 : 0.22})`;
      g.strokeStyle = lit ? 'rgba(255,255,255,.55)' : 'rgba(184,216,240,.18)'; g.lineWidth = 1; g.fill(); g.stroke();
    });
  }
  function sphere() {
    const cx = W / 2, cy = W / 2;
    const fill = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    fill.addColorStop(0, 'rgba(184,216,240,.22)'); fill.addColorStop(0.55, 'rgba(0,102,255,.12)'); fill.addColorStop(1, 'rgba(1,12,26,.55)');
    g.fillStyle = fill; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(184,216,240,.45)'; g.lineWidth = 1.2; g.stroke();
    // latitude and longitude lines, back half fainter
    const line = (fn) => { let prev = null; for (let k = 0; k <= 64; k++) { const p = proj(...fn(k / 64 * TAU)); if (prev) { g.strokeStyle = `rgba(184,216,240,${p[2] > 0 ? 0.32 : 0.08})`; g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(p[0], p[1]); g.stroke(); } prev = p; } };
    g.lineWidth = 0.8;
    for (let lat = -60; lat <= 60; lat += 30) { const y = Math.sin(lat * Math.PI / 180), r = Math.cos(lat * Math.PI / 180); line((a) => [Math.cos(a) * r, y, Math.sin(a) * r]); }
    for (let lon = 0; lon < 180; lon += 30) { const a0 = lon * Math.PI / 180; line((a) => [Math.cos(a) * Math.cos(a0), Math.sin(a), Math.cos(a) * Math.sin(a0)]); }
    DOTS.forEach((d) => { const p = proj(...d); if (p[2] < -0.1) return; g.fillStyle = `rgba(230,244,255,${0.25 + p[2] * 0.6})`; g.fillRect(p[0] - 0.8, p[1] - 0.8, 1.6, 1.6); });
  }
  function node(s, i, p, t) {
    const lit = i === featured || i === hover, depth = (p[2] + 1.5) / 3, r = (6 + depth * 8) * (lit ? 1.25 : 1) * (W / 480 + 0.25);
    // connector to the globe surface with two travelling gold beads
    const n = nodePos(s), len = Math.hypot(...n), surf = proj(n[0] / len, n[1] / len, n[2] / len);
    g.strokeStyle = `rgba(184,216,240,${0.15 + depth * 0.3})`; g.lineWidth = 1; g.beginPath(); g.moveTo(surf[0], surf[1]); g.lineTo(p[0], p[1]); g.stroke();
    for (let b = 0; b < 2; b++) { const u = ((t / 2600 + b * 0.5 + i * 0.13) % 1); const x = surf[0] + (p[0] - surf[0]) * u, y = surf[1] + (p[1] - surf[1]) * u; g.fillStyle = 'rgba(255,179,71,.85)'; g.shadowColor = '#FFB347'; g.shadowBlur = 8; g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill(); }
    g.shadowBlur = 0;
    const col = s.gold ? ['#FFE2B0', '#FFB347', '#8A5A12'] : ['#E6F4FF', '#0099FF', '#0A2A6B'];
    const grad = g.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.35, r * 0.1, p[0], p[1], r);
    grad.addColorStop(0, col[0]); grad.addColorStop(0.45, col[1]); grad.addColorStop(1, col[2]);
    g.shadowColor = col[1]; g.shadowBlur = lit ? 26 : 14; g.fillStyle = grad; g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.fill(); g.shadowBlur = 0;
    s.screen = [p[0], p[1], r];
  }
  function draw(t) {
    t = t || 0;
    g.clearRect(0, 0, W, W);
    const ps = SERVICES.map((s) => proj(...nodePos(s)));
    const order = SERVICES.map((s, i) => i).sort((a, b) => ps[a][2] - ps[b][2]);
    order.filter((i) => ps[i][2] <= 0).forEach((i) => node(SERVICES[i], i, ps[i], t));
    ringSeg(false); sphere(); ringSeg(true);
    order.filter((i) => ps[i][2] > 0).forEach((i) => node(SERVICES[i], i, ps[i], t));
    placeTip();
  }
  function placeTip() {
    const i = hover >= 0 ? hover : -1;
    if (i < 0 || !SERVICES[i].screen) { tip.classList.remove('on'); return; }
    const s = SERVICES[i]; tip.querySelector('b').textContent = s.name; tip.querySelector('span').textContent = s.tag + ' · tap to open';
    tip.style.left = s.screen[0] + 'px'; tip.style.top = s.screen[1] - s.screen[2] + 'px'; tip.classList.add('on');
  }
  // yaw that turns service i to face the viewer
  const faceYaw = (i) => SERVICES[i].ang - Math.PI / 2;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  function setFeatured(i, user) {
    featured = (i + SERVICES.length) % SERVICES.length;
    carName.style.opacity = 0;
    setTimeout(() => { carName.textContent = SERVICES[featured].name; carLink.href = SERVICES[featured].href; carName.style.opacity = 1; }, REDUCED ? 0 : 180);
    if (user) idleUntil = performance.now() + 9000;
    if (REDUCED) { yaw = faceYaw(featured); draw(); }
  }
  let lastT = 0, cycleAt = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    if (!visible) return;
    const dt = Math.min(50, t - (lastT || t)); lastT = t;
    if (!dragging) {
      if (t > idleUntil) { // carousel mode: turn to the featured service, advance every 4.5s
        if (t > cycleAt) { cycleAt = t + 4500; if (lastT) setFeatured(featured + 1); }
        yaw += wrap(faceYaw(featured) - yaw) * 0.04;
      } else { yaw += vel; vel *= 0.95; }
    }
    draw(t);
  }

  // ── Pointer: drag to spin, hover to inspect, tap to open ──
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const hit = (x, y) => SERVICES.findIndex((s) => s.screen && Math.hypot(x - s.screen[0], y - s.screen[1]) < s.screen[2] + 8);
  canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = e.clientX; vel = 0; canvas.setPointerCapture(e.pointerId); canvas.classList.add('dragging'); idleUntil = performance.now() + 9000; });
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); yaw += dx * 0.008; vel = dx * 0.008; if (REDUCED) draw(); return; }
    const h = hit(x, y); if (h !== hover) { hover = h; canvas.style.cursor = h >= 0 ? 'pointer' : ''; if (REDUCED) draw(); }
  });
  const end = (e) => {
    if (!dragging) return; dragging = false; canvas.classList.remove('dragging');
    if (moved < 6) { const [x, y] = local(e), h = hit(x, y); if (h >= 0) location.href = SERVICES[h].href; }
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', () => { dragging = false; canvas.classList.remove('dragging'); });
  canvas.addEventListener('pointerleave', () => { hover = -1; if (REDUCED) draw(); });
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setFeatured(featured + (e.key === 'ArrowRight' ? 1 : -1), true); }
    if (e.key === 'Enter') location.href = SERVICES[featured].href;
  });
  document.getElementById('globe-prev').addEventListener('click', () => setFeatured(featured - 1, true));
  document.getElementById('globe-next').addEventListener('click', () => setFeatured(featured + 1, true));

  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(canvas);
  new ResizeObserver(size).observe(canvas);
  size(); yaw = faceYaw(0); setFeatured(0);
  if (REDUCED) draw(); else requestAnimationFrame((t) => { cycleAt = t + 4500; loop(t); });
})();
