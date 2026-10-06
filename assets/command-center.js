/* MGC Command Center — admin-only realtime KPI dashboard.
 * Reads Supabase live (RLS: public.mgc_is_admin()). Any table that is missing or empty
 * falls back to clearly labelled SAMPLE data. ?demo=1 shows sample data only, no sign-in.
 * All dynamic text goes through textContent. */
(function () {
  'use strict';

  // Keep in sync with admin.html and the mgc_admins table.
  const ADMIN_EMAILS = ['markatmgc@gmail.com', 'admin@mgcglobalconsulting.com', 'mgcglobalconsulting@gmail.com'];
  const SUPABASE_URL = 'https://bjnpibxaxlgvlzeegwnm.supabase.co';
  const SUPABASE_ANON = 'sb_publishable_Nj15e9wDVGVjBANsOdcTbg_AyXa1UJD';
  const DEMO = window.CC_DEMO === true || new URLSearchParams(location.search).has('demo');
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TABLES = [
    'mgc_leads', 'mgc_bookings', 'mgc_client_profiles', 'mgc_invoices', 'mgc_projects',
    'mgc_questionnaires', 'mgc_approvals', 'mgc_staff', 'mgc_time_entries',
    'mgc_model_usage', 'mgc_tasks', 'mgc_agent_events', 'mgc_intake_ideas',
  ];
  const COLORS = {
    mgc_leads: '#00D4FF', mgc_bookings: '#1A8FD1', mgc_client_profiles: '#FFFFFF',
    mgc_invoices: '#FFB347', mgc_projects: '#2DD4BF', mgc_questionnaires: '#3B82F6',
    mgc_approvals: '#A78BFA', mgc_staff: '#2DD4BF', mgc_time_entries: '#1A8FD1',
    mgc_model_usage: '#3B82F6', mgc_tasks: '#22C55E', mgc_agent_events: '#2DD4BF',
    mgc_intake_ideas: '#FFB347',
  };
  const LABELS = {
    mgc_leads: 'Lead', mgc_bookings: 'Booking', mgc_client_profiles: 'Client', mgc_invoices: 'Invoice',
    mgc_projects: 'Project', mgc_questionnaires: 'Intake', mgc_approvals: 'Approval', mgc_staff: 'Staff',
    mgc_time_entries: 'Time', mgc_model_usage: 'Model call', mgc_tasks: 'Task', mgc_agent_events: 'Agent',
    mgc_intake_ideas: 'Ideas',
  };
  const MODEL_COLORS = ['#00D4FF', '#FFB347', '#A78BFA', '#2DD4BF', '#1A8FD1', '#22C55E'];

  const state = {};
  const isSample = {};
  let sb = null;

  // ── Helpers ──
  const $ = (id) => document.getElementById(id);
  const DAY = 864e5;
  const now = () => Date.now();
  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.style.cssText = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach((c) => c != null && n.append(c));
    return n;
  }
  function svg(tag, attrs, kids) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    (kids || []).forEach((c) => c && n.append(c));
    return n;
  }
  const usd = (cents, dp) => '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  const num = (v) => Math.round(v || 0).toLocaleString('en-US');
  const compact = (v) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);
  const ts = (v) => (v ? new Date(v).getTime() : 0);
  const created = (r) => ts(r.created_at);
  function ago(t) {
    const s = Math.max(0, (now() - t) / 1000);
    if (s < 60) return Math.round(s) + 's ago';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }
  const fmtDay = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtWhen = (t) => new Date(t).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  const within = (t, from, to) => t >= from && t < to;
  const sum = (arr, f) => arr.reduce((a, r) => a + (Number(f(r)) || 0), 0);
  const lc = (v) => String(v || '').toLowerCase();

  // Field accessors tolerate small schema differences between tables.
  const invCents = (r) => r.amount_cents != null ? Number(r.amount_cents) : Math.round(Number(r.amount || 0) * 100);
  const invStatus = (r) => lc(r.status);
  const invPaidAt = (r) => ts(r.paid_at || r.updated_at || r.created_at);
  const bookAt = (r) => ts(r.scheduled_start || r.start_time || r.scheduled_at || r.created_at);
  const stage = (r) => lc(r.onboarding_status || r.onboarding_stage || r.status);
  const OPEN_INV = ['open', 'sent', 'overdue', 'unpaid', 'pending', 'draft'];
  const isOverdue = (r) => invStatus(r) === 'overdue' || (OPEN_INV.includes(invStatus(r)) && r.due_date && ts(r.due_date) < now());

  // ── Sample data (deterministic, relative to now) ──
  function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
  function buildSample() {
    const r = rng(42);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const id = (p, i) => p + '-' + i;
    const T = now();
    const iso = (t) => new Date(t).toISOString();
    const S = {};

    const humans = [
      ['Founder', 'Strategy and sales', 17500], ['Strategy Lead', 'AI consulting', 12500],
      ['Automation Engineer', 'Build and integrations', 9500], ['Ops Coordinator', 'Client success', 5500],
    ];
    const agents = [
      ['Intake Agent', 'Qualifies leads, writes intake ideas'], ['Client Success Agent', 'Onboarding and check-ins'],
      ['Billing Agent', 'Invoices and payment follow-up'], ['Outreach Agent', 'Email outreach drafts'],
      ['Ops Monitor', 'Watches functions and webhooks'],
    ];
    S.mgc_staff = humans.map((h, i) => ({ id: id('h', i), kind: 'human', name: h[0], role: h[1], hourly_rate_cents: h[2], status: 'active', created_at: iso(T - 90 * DAY) }))
      .concat(agents.map((a, i) => ({ id: id('a', i), kind: 'agent', name: a[0], role: a[1], default_model: i === 0 ? 'claude-sonnet-5-5' : 'claude-haiku-4-5', status: i === 4 ? 'paused' : 'active', last_heartbeat_at: iso(T - (i === 4 ? 3 * 3600e3 : r() * 90e3)), created_at: iso(T - 30 * DAY) })));

    S.mgc_time_entries = [];
    humans.forEach((h, i) => { for (let d = 0; d < 14; d++) { if (new Date(T - d * DAY).getDay() % 6 === 0) continue; const hrs = 3 + Math.round(r() * 10) / 2; S.mgc_time_entries.push({ id: id('t', i + '-' + d), staff_id: id('h', i), entry_date: iso(T - d * DAY).slice(0, 10), hours: hrs, billable: r() < 0.78 - i * 0.05, created_at: iso(T - d * DAY) }); } });

    const models = [['claude-haiku-4-5', 0.6], ['claude-sonnet-5-5', 0.3], ['claude-opus-5-5', 0.1]];
    const price = { 'claude-haiku-4-5': [1, 5], 'claude-sonnet-5-5': [3, 15], 'claude-opus-5-5': [5, 25] };
    const sources = [['trueassist', null], ['booking-assistant', null], ['intake-ideas', 'a-0'], ['Client Success Agent', 'a-1'], ['Billing Agent', 'a-2'], ['Outreach Agent', 'a-3'], ['Ops Monitor', 'a-4'], ['research', 'h-0'], ['drafting', 'h-1'], ['build', 'h-2']];
    S.mgc_model_usage = [];
    for (let i = 0; i < 420; i++) {
      const x = r(); const m = x < models[0][1] ? models[0][0] : x < 0.9 ? models[1][0] : models[2][0];
      const src = pick(sources); const inT = 400 + Math.round(r() * 5000); const outT = 120 + Math.round(r() * 1400);
      S.mgc_model_usage.push({ id: i, staff_id: src[1], source: src[0], model: m, input_tokens: inT, output_tokens: outT, cost_cents: ((inT * price[m][0] + outT * price[m][1]) / 1e6) * 100, created_at: iso(T - r() * 30 * DAY) });
    }

    const cos = ['Harbor Dental Group', 'Chesapeake Freight', 'Patapsco Realty', 'Severn Fitness Studio', 'Bay Ridge Law', 'Linthicum HVAC', 'Fells Point Bakery', 'Towson Pediatrics', 'Annapolis Marine Supply', 'Columbia Tutoring Co'];
    const interests = ['AI consulting', 'Automation', 'CRM optimization', 'Systems design', 'AI workshops', 'Retainer support'];
    S.mgc_leads = Array.from({ length: 34 }, (_, i) => ({ id: id('l', i), company: pick(cos), name: 'Sample contact', email: 'sample@example.com', interest: pick(interests), source: pick(['trueassist', 'booking', 'contact-form', 'referral']), status: pick(['new', 'new', 'contacted', 'qualified']), created_at: iso(T - r() * 30 * DAY) }));
    S.mgc_bookings = Array.from({ length: 16 }, (_, i) => ({ id: id('b', i), service_line: pick(interests), status: 'confirmed', scheduled_start: iso(new Date(T + Math.round(r() * 20 - 12) * DAY).setHours(9 + Math.floor(r() * 9), r() < 0.5 ? 0 : 30, 0, 0)), created_at: iso(T - r() * 25 * DAY) }));
    S.mgc_client_profiles = Array.from({ length: 12 }, (_, i) => ({ id: id('c', i), company: cos[i % cos.length], full_name: 'Sample client', onboarding_status: ['new', 'onboarding', 'onboarding', 'active', 'active', 'active'][i % 6], created_at: iso(T - r() * 60 * DAY) }));
    S.mgc_invoices = Array.from({ length: 26 }, (_, i) => { const c = T - r() * 84 * DAY; const st = c < T - 21 * DAY ? (r() < 0.9 ? 'paid' : 'overdue') : pick(['paid', 'open', 'open', 'paid']); return { id: id('i', i), company: pick(cos), title: pick(interests), amount_cents: pick([19900, 49900, 129900, 169000, 250000, 480000]), status: st, due_date: iso(c + 14 * DAY).slice(0, 10), paid_at: st === 'paid' ? iso(Math.min(T, c + r() * 10 * DAY)) : null, created_at: iso(c) }; });
    S.mgc_projects = [
      ['CRM rebuild', 'Harbor Dental Group', 72], ['Lead-routing automation', 'Chesapeake Freight', 45], ['AI readiness workshop', 'Bay Ridge Law', 90],
      ['Ops systems design', 'Patapsco Realty', 28], ['Retainer: monthly support', 'Severn Fitness Studio', 60],
    ].map((p, i) => ({ id: id('p', i), title: p[0], company: p[1], progress: p[2], status: 'active', due_date: iso(T + (7 + i * 6) * DAY).slice(0, 10), created_at: iso(T - 40 * DAY) }));
    const taskTitles = ['Send kickoff deck', 'Map HubSpot pipeline stages', 'Write Zapier fallback', 'Review intake ideas', 'Chase overdue invoice', 'Draft outreach sequence', 'QA booking webhook', 'Record workshop recap', 'Approve Billing Agent email', 'Set up client Slack channel', 'Prep QBR slides', 'Audit Supabase RLS', 'Price retainer renewal', 'Update case study'];
    S.mgc_tasks = taskTitles.map((t, i) => ({ id: id('k', i), title: t, status: ['todo', 'todo', 'doing', 'blocked', 'done'][i % 5], priority: ['normal', 'high', 'normal', 'urgent', 'low'][i % 5], assignee_id: pick(S.mgc_staff).id, due_date: iso(T + (r() * 10 - 3) * DAY).slice(0, 10), created_at: iso(T - r() * 10 * DAY) }));
    S.mgc_approvals = [
      ['Billing Agent', 'invoice_email', 'pending'], ['Outreach Agent', 'outreach_email', 'pending'], ['Client Success Agent', 'check_in', 'approved'],
      ['Intake Agent', 'ideas_send', 'pending'], ['Billing Agent', 'payment_reminder', 'sent'],
    ].map((a, i) => ({ id: id('ap', i), agent: a[0], kind: a[1], status: a[2], payload: { summary: pick(cos) }, created_at: iso(T - (i + 1) * 2.3 * 3600e3) }));
    const evs = ['run', 'run', 'run', 'handoff', 'approval_requested', 'heartbeat'];
    S.mgc_agent_events = Array.from({ length: 48 }, (_, i) => { const a = pick(agents.slice(0, 4)); return { id: i, agent: a[0], event: pick(evs), detail: a[1], created_at: iso(T - r() * 24 * 3600e3) }; });
    S.mgc_questionnaires = [['Annapolis Marine Supply', 'Marine parts retailer, 2 stores plus online', 'Online orders get lost between Shopify and the warehouse'], ['Towson Pediatrics', 'Pediatric practice, 6 providers', 'Phones are swamped every morning with scheduling calls']]
      .map((q, i) => ({ id: id('q', i), company: q[0], client_name: 'Sample client', q1: q[1], q2: q[2], reviewed: false, created_at: iso(T - (i * 5 + 1.5) * 3600e3) }));
    const slack = [['Mark', '#site-inquiries: Harbor Dental wants the after-hours booking idea scoped this week'], ['Strategy Lead', '#client-chesapeake: carrier scorecard export is ready for review'], ['Billing Agent', '#payments: reminder drafted for Linthicum HVAC, waiting for approval'], ['Ops Coordinator', '#client-severn: trial follow-up sequence copy approved by the owner'], ['Intake Agent', '#site-inquiries: 4 ideas posted for Bay Ridge Law']];
    S.mgc_agent_events.push(...Array.from({ length: 22 }, (_, i) => { const m = slack[i % slack.length]; return { id: 's' + i, agent: m[0], event: i % 3 ? 'slack_message' : 'slack_reply', detail: m[1], created_at: iso(T - r() * (i % 2 ? 20 * 3600e3 : 14 * DAY)) }; }));
    S.mgc_intake_ideas = [
      ['Harbor Dental Group', [['After-hours booking agent', 'Patients call after 6 pm and hit voicemail; a chat agent books them into open slots.', 'Connect the scheduling system to a booking assistant.', 'automation'], ['Recall reminders by SMS', 'Lapsed patients are the cheapest revenue to win back.', 'Pull a 12-month lapsed list from the PMS.', 'crm-optimization'], ['Insurance FAQ assistant', 'Front desk spends hours on coverage questions.', 'Collect the top 20 coverage questions.', 'ai-consulting'], ['Review request loop', 'More Google reviews lift new-patient calls.', 'Trigger a review ask 2 hours after each visit.', 'automation']]],
      ['Chesapeake Freight', [['Quote turnaround bot', 'Shippers buy from whoever quotes first.', 'Template the 5 most common lanes.', 'automation'], ['Carrier scorecards', 'On-time data already exists but nobody reads it.', 'Export last quarter of loads.', 'systems-design'], ['CRM lane tagging', 'Reps cannot see which customers ship which lanes.', 'Add lane fields to the CRM deal record.', 'crm-optimization'], ['Dispatcher AI workshop', 'Team adoption decides whether tools stick.', 'Book a 90-minute hands-on session.', 'ai-workshops']]],
      ['Severn Fitness Studio', [['Trial-to-member follow-up', 'Most trials never hear back after day one.', 'Write a 3-touch sequence for trial guests.', 'automation'], ['Class demand forecast', 'Empty 6 am slots cost instructor hours.', 'Export 6 months of attendance.', 'systems-design'], ['Member churn alerts', 'Members who skip 2 weeks usually cancel.', 'Flag 14-day inactivity in the CRM.', 'crm-optimization'], ['Monthly retainer check-in', 'Small studios need a steady hand, not a project.', 'Start on the Starter retainer.', 'retainer-support']]],
      ['Bay Ridge Law', [['Intake triage assistant', 'Qualify matters before an attorney spends time.', 'List disqualifying criteria per practice area.', 'ai-consulting'], ['Document checklist automation', 'Clients forget documents and delay filings.', 'Build the checklist per matter type.', 'automation'], ['Referral source tracking', 'Best referral partners are not thanked or tracked.', 'Add a referral field to every new matter.', 'crm-optimization'], ['Ethics-safe AI policy', 'Staff are already using AI without guardrails.', 'Run a policy workshop for associates.', 'ai-workshops']]],
    ].map((x, i) => ({ id: id('ii', i), company: x[0], ideas: x[1].map((d) => ({ title: d[0], why: d[1], first_step: d[2], service_line: d[3] })), status: 'new', model: 'claude-haiku-4-5', created_at: iso(T - (i * 9 + 2) * 3600e3) }));
    return S;
  }
  const SAMPLE = buildSample();

  // ── Data loading ──
  async function fetchTable(t) {
    if (DEMO || !sb) return null;
    try {
      const { data, error } = await sb.from(t).select('*').order('created_at', { ascending: false }).limit(1000);
      if (error) return null;
      return data;
    } catch { return null; }
  }
  async function loadAll() {
    const rows = await Promise.all(TABLES.map(fetchTable));
    TABLES.forEach((t, i) => {
      const real = rows[i];
      if (real && real.length) { state[t] = real; isSample[t] = false; }
      else { state[t] = (SAMPLE[t] || []).slice(); isSample[t] = true; }
    });
  }

  // ── Rendering ──
  function markSample(node, tables) {
    const sample = tables.some((t) => isSample[t]);
    node.classList.toggle('is-sample', sample);
    let tag = node.querySelector(':scope > .cc-sample-tag');
    if (sample && !tag) node.prepend(el('span', { class: 'cc-sample-tag', text: 'SAMPLE' }));
    if (!sample && tag) tag.remove();
  }
  function sparkline(values, color) {
    const w = 200, h = 34, max = Math.max(1, ...values), n = values.length;
    const pts = values.map((v, i) => [(i / Math.max(1, n - 1)) * w, h - 3 - (v / max) * (h - 6)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const gid = 'g' + Math.random().toString(36).slice(2, 8);
    return svg('svg', { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, [
      svg('defs', {}, [svg('linearGradient', { id: gid, x1: 0, x2: 0, y1: 0, y2: 1 }, [svg('stop', { offset: '0', 'stop-color': color, 'stop-opacity': '.35' }), svg('stop', { offset: '1', 'stop-color': color, 'stop-opacity': '0' })])]),
      svg('path', { d: d + ` L${w} ${h} L0 ${h} Z`, fill: `url(#${gid})` }),
      svg('path', { d, fill: 'none', stroke: color, 'stroke-width': '1.6', 'vector-effect': 'non-scaling-stroke' }),
    ]);
  }
  function series(rows, getT, days, bucketDays, getV) {
    const out = new Array(Math.ceil(days / bucketDays)).fill(0);
    const start = now() - days * DAY;
    rows.forEach((r) => { const t = getT(r); if (t >= start && t <= now()) { const i = Math.min(out.length - 1, Math.floor((t - start) / (bucketDays * DAY))); out[i] += getV ? Number(getV(r)) || 0 : 1; } });
    return out;
  }
  function delta(cur, prev) {
    if (!prev) return cur ? el('span', { class: 'up', text: 'new' }) : null;
    const p = Math.round(((cur - prev) / prev) * 100);
    return el('span', { class: p >= 0 ? 'up' : 'down', text: (p >= 0 ? '+' : '') + p + '%' });
  }

  function renderKpis() {
    const T = now();
    const inv = state.mgc_invoices, leads = state.mgc_leads, book = state.mgc_bookings;
    const paid = inv.filter((r) => invStatus(r) === 'paid');
    const rev30 = sum(paid.filter((r) => invPaidAt(r) > T - 30 * DAY), invCents);
    const revPrev = sum(paid.filter((r) => within(invPaidAt(r), T - 60 * DAY, T - 30 * DAY)), invCents);
    const open = inv.filter((r) => OPEN_INV.includes(invStatus(r)));
    const overdue = inv.filter(isOverdue);
    const l7 = leads.filter((r) => created(r) > T - 7 * DAY).length;
    const lPrev = leads.filter((r) => within(created(r), T - 14 * DAY, T - 7 * DAY)).length;
    const upcoming = book.filter((r) => within(bookAt(r), T, T + 7 * DAY)).sort((a, b) => bookAt(a) - bookAt(b));
    const clients = state.mgc_client_profiles;
    const active = clients.filter((r) => stage(r) === 'active').length;
    const onboarding = clients.filter((r) => ['onboarding', 'in_progress', 'kickoff'].includes(stage(r))).length;
    const pend = state.mgc_approvals.filter((r) => lc(r.status) === 'pending');
    const oldest = pend.reduce((m, r) => Math.min(m, created(r)), T);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const usageM = state.mgc_model_usage.filter((r) => created(r) >= monthStart);
    const spend = sum(usageM, (r) => r.cost_cents);
    const tokens = sum(usageM, (r) => (r.input_tokens || 0) + (r.output_tokens || 0));
    const humans = state.mgc_staff.filter((s) => s.kind === 'human');
    const te7 = state.mgc_time_entries.filter((r) => ts(r.entry_date || r.created_at) > T - 7 * DAY);
    const billable = sum(te7.filter((r) => r.billable !== false), (r) => r.hours);
    const util = humans.length ? Math.round((billable / (humans.length * 40)) * 100) : 0;

    const kpis = [
      { label: 'Revenue, 30 days', value: usd(rev30), sub: [delta(rev30, revPrev), ' vs prior 30d'], spark: series(paid, invPaidAt, 56, 7, invCents), color: '#FFB347', gold: true, src: ['mgc_invoices'] },
      { label: 'Outstanding', value: usd(sum(open, invCents)), sub: [overdue.length + ' overdue'], spark: series(open, created, 56, 7, invCents), color: '#F59E0B', src: ['mgc_invoices'] },
      { label: 'New leads, 7 days', value: num(l7), sub: [delta(l7, lPrev), ' vs prior week'], spark: series(leads, created, 14, 1), color: '#00D4FF', src: ['mgc_leads'] },
      { label: 'Bookings, next 7 days', value: num(upcoming.length), sub: [upcoming[0] ? 'Next: ' + fmtWhen(bookAt(upcoming[0])) : 'None scheduled'], spark: series(book, created, 14, 1), color: '#1A8FD1', src: ['mgc_bookings'] },
      { label: 'Active clients', value: num(active), sub: [onboarding + ' onboarding, ' + clients.length + ' total'], spark: series(clients, created, 56, 7), color: '#2DD4BF', src: ['mgc_client_profiles'] },
      { label: 'Pending approvals', value: num(pend.length), sub: [pend.length ? 'Oldest ' + ago(oldest) : 'Queue clear'], spark: series(state.mgc_approvals, created, 7, 1), color: '#A78BFA', src: ['mgc_approvals'] },
      { label: 'AI spend, this month', value: usd(spend, 2), sub: [compact(tokens) + ' tokens'], spark: series(state.mgc_model_usage, created, 14, 1, (r) => r.cost_cents), color: '#3B82F6', src: ['mgc_model_usage'] },
      { label: 'Billable hours, 7 days', value: num(billable), sub: [util + '% utilization of ' + humans.length * 40 + 'h'], spark: series(state.mgc_time_entries.filter((r) => r.billable !== false), (r) => ts(r.entry_date || r.created_at), 14, 1, (r) => r.hours), color: '#22C55E', src: ['mgc_time_entries', 'mgc_staff'] },
    ];
    const wrap = $('cc-kpis');
    wrap.replaceChildren(...kpis.map((k) => {
      const n = el('div', { class: 'cc-kpi' + (k.gold ? ' gold' : ''), 'data-src': k.src.join(' ') }, [
        el('div', { class: 'cc-kpi-label', text: k.label }),
        el('div', { class: 'cc-kpi-value', text: k.value }),
        el('div', { class: 'cc-kpi-sub' }, k.sub.map((s) => (typeof s === 'string' ? document.createTextNode(s) : s))),
        sparkline(k.spark, k.color),
      ]);
      markSample(n, k.src);
      return n;
    }));
  }

  function renderRevenue() {
    const paid = state.mgc_invoices.filter((r) => invStatus(r) === 'paid');
    const weeks = series(paid, invPaidAt, 84, 7, invCents);
    $('cc-rev-total').textContent = usd(weeks.reduce((a, b) => a + b, 0)) + ' total';
    const W = 640, H = 220, pad = { l: 44, r: 8, t: 10, b: 24 };
    const max = Math.max(1, ...weeks) * 1.15, bw = (W - pad.l - pad.r) / weeks.length;
    const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
    const kids = [svg('defs', {}, [svg('linearGradient', { id: 'cc-rev-g', x1: 0, x2: 0, y1: 0, y2: 1 }, [svg('stop', { offset: '0', 'stop-color': '#FFB347' }), svg('stop', { offset: '1', 'stop-color': '#C9892A', 'stop-opacity': '.25' })])])];
    [0, 0.5, 1].forEach((f) => {
      const v = max * f, yy = y(v);
      kids.push(svg('line', { x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, stroke: 'rgba(255,255,255,.06)' }));
      const t = svg('text', { x: pad.l - 6, y: yy + 3, 'text-anchor': 'end', class: 'cc-axis' }); t.textContent = '$' + compact(v / 100); kids.push(t);
    });
    const start = now() - 84 * DAY;
    weeks.forEach((v, i) => {
      const x = pad.l + i * bw + bw * 0.18, h = H - pad.b - y(v);
      const rect = svg('rect', { x, y: y(v), width: bw * 0.64, height: Math.max(0, h), rx: 3, fill: 'url(#cc-rev-g)' });
      const tt = svg('title'); tt.textContent = 'Week of ' + fmtDay(start + i * 7 * DAY) + ': ' + usd(v); rect.append(tt);
      kids.push(rect);
      if (i % 2 === 0) { const t = svg('text', { x: x + bw * 0.32, y: H - 6, 'text-anchor': 'middle', class: 'cc-axis' }); t.textContent = fmtDay(start + i * 7 * DAY); kids.push(t); }
    });
    $('cc-rev-chart').replaceChildren(svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img', 'aria-label': 'Weekly revenue collected' }, kids));
    markSample($('cc-rev-chart').closest('.cc-card'), ['mgc_invoices']);
  }

  function renderFunnel() {
    const from = now() - 30 * DAY;
    const steps = [
      ['Leads', state.mgc_leads.filter((r) => created(r) > from).length],
      ['Booked calls', state.mgc_bookings.filter((r) => created(r) > from).length],
      ['Onboarding', state.mgc_client_profiles.filter((r) => ['onboarding', 'in_progress', 'kickoff', 'new'].includes(stage(r))).length],
      ['Active clients', state.mgc_client_profiles.filter((r) => stage(r) === 'active').length],
      ['Paid invoices', state.mgc_invoices.filter((r) => invStatus(r) === 'paid' && invPaidAt(r) > from).length],
    ];
    const max = Math.max(1, ...steps.map((s) => s[1]));
    const conv = steps[0][1] ? Math.round((steps[1][1] / steps[0][1]) * 100) : 0;
    $('cc-funnel').replaceChildren(...steps.map((s) => el('div', { class: 'cc-funnel-row' }, [
      el('span', { text: s[0] }),
      el('div', { class: 'cc-funnel-bar' }, [el('div', { class: 'cc-funnel-fill', style: `width:${(s[1] / max) * 100}%` })]),
      el('span', { class: 'cc-funnel-n', text: num(s[1]) }),
    ])), el('p', { class: 'cc-funnel-note', text: conv + '% of leads booked a call in the last 30 days.' }));
    markSample($('cc-funnel').closest('.cc-card'), ['mgc_leads', 'mgc_bookings', 'mgc_client_profiles']);
  }

  function table(id, head, rows, numCols) {
    const thead = el('thead', {}, [el('tr', {}, head.map((h, i) => el('th', { class: numCols.includes(i) ? 'num' : '', text: h })))]);
    const tbody = el('tbody', {}, rows.length ? rows.map((r) => el('tr', {}, r.map((c, i) => {
      const td = el('td', { class: numCols.includes(i) ? 'num' : '' });
      if (c instanceof Node) td.append(c); else if (Array.isArray(c)) td.append(...c); else td.textContent = c;
      return td;
    }))) : [el('tr', {}, [el('td', { colspan: head.length, class: 'cc-empty', text: 'No rows yet.' })])]);
    $(id).replaceChildren(thead, tbody);
  }

  function renderWorkforce() {
    const T = now();
    const staff = state.mgc_staff;
    const te = state.mgc_time_entries.filter((r) => ts(r.entry_date || r.created_at) > T - 7 * DAY);
    const tasks = state.mgc_tasks.filter((t) => lc(t.status) !== 'done');
    const usage30 = state.mgc_model_usage.filter((r) => created(r) > T - 30 * DAY);
    const humans = staff.filter((s) => s.kind === 'human').map((s) => {
      const mine = te.filter((r) => r.staff_id === s.id);
      const hrs = sum(mine, (r) => r.hours), bill = sum(mine.filter((r) => r.billable !== false), (r) => r.hours);
      const pct = hrs ? Math.round((bill / hrs) * 100) : 0;
      const ai = sum(usage30.filter((r) => r.staff_id === s.id), (r) => r.cost_cents);
      return [[s.name, el('small', { text: s.role || '' })], s.hourly_rate_cents ? usd(s.hourly_rate_cents) + '/h' : '—', hrs.toFixed(1), usd(hrs * (s.hourly_rate_cents || 0)),
        [el('span', { class: 'cc-util' }, [el('span', { style: `width:${pct}%` })]), document.createTextNode(pct + '%')], usd(ai, 2), String(tasks.filter((t) => t.assignee_id === s.id).length)];
    });
    table('cc-humans', ['Name', 'Rate', 'Hours', 'Labor cost', 'Billable', 'AI spend 30d', 'Open tasks'], humans, [1, 2, 3, 5, 6]);
    markSample($('cc-humans').closest('.cc-card'), ['mgc_staff', 'mgc_time_entries']);

    const day = state.mgc_agent_events.filter((r) => created(r) > T - DAY);
    const agents = staff.filter((s) => s.kind === 'agent').map((s) => {
      const runs = day.filter((e) => e.staff_id === s.id || e.agent === s.name).length;
      const u = usage30.filter((r) => r.staff_id === s.id || r.source === s.name);
      const hb = ts(s.last_heartbeat_at);
      const lastEv = Math.max(hb, ...state.mgc_agent_events.filter((e) => e.agent === s.name).map(created), 0);
      const cls = lc(s.status) !== 'active' ? 'off' : lastEv > T - 5 * 60e3 ? 'live' : 'idle';
      const appr = state.mgc_approvals.filter((a) => a.agent === s.name);
      const ok = appr.filter((a) => ['approved', 'sent'].includes(lc(a.status))).length;
      return [[el('span', { class: 'cc-hex' + (cls === 'live' ? ' live' : ''), text: initials(s.name) }), el('span', { class: 'cc-dot ' + cls }), document.createTextNode(s.name), el('small', { text: s.role || '' })], (s.default_model || '—').replace('claude-', ''),
        String(runs), compact(sum(u, (r) => (r.input_tokens || 0) + (r.output_tokens || 0))), usd(sum(u, (r) => r.cost_cents), 2),
        appr.length ? Math.round((ok / appr.length) * 100) + '%' : '—', lastEv ? ago(lastEv) : 'never'];
    });
    table('cc-agents', ['Agent', 'Model', 'Runs 24h', 'Tokens 30d', 'Cost 30d', 'Approved', 'Last seen'], agents, [2, 3, 4, 5]);
    markSample($('cc-agents').closest('.cc-card'), ['mgc_staff', 'mgc_agent_events']);
  }

  function renderModels() {
    const T = now();
    const u = state.mgc_model_usage.filter((r) => created(r) > T - 30 * DAY);
    const by = {};
    u.forEach((r) => { const m = (r.model || 'unknown').replace(/-\d{8}$/, ''); by[m] = (by[m] || 0) + Number(r.cost_cents || 0); });
    const segs = Object.entries(by).sort((a, b) => b[1] - a[1]);
    const total = segs.reduce((a, s) => a + s[1], 0);
    $('cc-model-total').textContent = usd(total, 2);
    const R = 70, C = 2 * Math.PI * R; let off = 0;
    const rings = [svg('circle', { cx: 90, cy: 90, r: R, fill: 'none', stroke: 'rgba(255,255,255,.05)', 'stroke-width': 18 })];
    segs.forEach((s, i) => {
      const len = total ? (s[1] / total) * C : 0;
      rings.push(svg('circle', { cx: 90, cy: 90, r: R, fill: 'none', stroke: MODEL_COLORS[i % MODEL_COLORS.length], 'stroke-width': 18, 'stroke-dasharray': `${Math.max(0, len - 2)} ${C}`, 'stroke-dashoffset': -off, transform: 'rotate(-90 90 90)' }));
      off += len;
    });
    const t1 = svg('text', { x: 90, y: 88, 'text-anchor': 'middle', fill: '#fff', 'font-family': 'Raleway', 'font-weight': 800, 'font-size': 22 }); t1.textContent = compact(sum(u, (r) => (r.input_tokens || 0) + (r.output_tokens || 0)));
    const t2 = svg('text', { x: 90, y: 106, 'text-anchor': 'middle', class: 'cc-axis' }); t2.textContent = 'TOKENS';
    $('cc-donut').replaceChildren(svg('svg', { viewBox: '0 0 180 180', role: 'img', 'aria-label': 'Spend by model' }, rings.concat([t1, t2])));
    $('cc-donut-legend').replaceChildren(...(segs.length ? segs.map((s, i) => el('li', {}, [el('i', { style: `background:${MODEL_COLORS[i % MODEL_COLORS.length]}` }), el('span', { text: s[0] }), el('span', { text: usd(s[1], 2) + ' · ' + Math.round((s[1] / (total || 1)) * 100) + '%' })])) : [el('li', { class: 'cc-empty', text: 'No model calls yet.' })]));
    markSample($('cc-donut').closest('.cc-card'), ['mgc_model_usage']);

    // Usage per employee/agent, stacked by model
    const names = {}; state.mgc_staff.forEach((s) => (names[s.id] = s));
    const who = {};
    u.forEach((r) => {
      const s = names[r.staff_id]; const key = s ? s.name : r.source || 'unattributed';
      const w = (who[key] = who[key] || { kind: s ? s.kind : 'system', total: 0, cost: 0, models: {} });
      const tok = (r.input_tokens || 0) + (r.output_tokens || 0); const m = (r.model || 'unknown').replace(/-\d{8}$/, '');
      w.total += tok; w.cost += Number(r.cost_cents || 0); w.models[m] = (w.models[m] || 0) + tok;
    });
    const rows = Object.entries(who).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
    const max = Math.max(1, ...rows.map((r) => r[1].total));
    const modelIdx = Object.fromEntries(segs.map((s, i) => [s[0], i]));
    $('cc-usage-bars').replaceChildren(...(rows.length ? rows.map(([name, w]) => el('div', { class: 'cc-hbar' }, [
      el('div', { class: 'cc-hbar-name' }, [document.createTextNode(name), el('small', { text: w.kind === 'human' ? 'Employee' : w.kind === 'agent' ? 'Agent' : 'Site assistant' })]),
      el('div', { class: 'cc-hbar-track', style: `width:${(w.total / max) * 100}%` }, Object.entries(w.models).map(([m, v]) => el('span', { style: `width:${(v / w.total) * 100}%;background:${MODEL_COLORS[(modelIdx[m] ?? 5) % MODEL_COLORS.length]}`, title: m + ': ' + compact(v) }))),
      el('div', { class: 'cc-hbar-val', text: compact(w.total) + ' · ' + usd(w.cost, 2) }),
    ])) : [el('p', { class: 'cc-empty', text: 'No model calls yet.' })]));
    markSample($('cc-usage-bars').closest('.cc-card'), ['mgc_model_usage', 'mgc_staff']);
  }

  // ── Writes (approvals, to-dos, ideas) ──
  // Sample rows and demo mode change only the page; real rows save to Supabase (admin RLS).
  function toast(msg) {
    const n = $('cc-toast'); n.textContent = msg; n.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (n.hidden = true), 2600);
  }
  async function updateRow(t, row, patch, msg) {
    Object.assign(row, patch); renderAll();
    if (DEMO || !sb || isSample[t] || String(row.id).startsWith('local-')) return toast(msg + (DEMO ? ' (demo, not saved)' : isSample[t] ? ' (sample row, not saved)' : ''));
    const { error } = await sb.from(t).update(patch).eq('id', row.id);
    toast(error ? 'Could not save: ' + error.message : msg);
  }
  async function insertRow(t, row, msg) {
    if (isSample[t] && !DEMO) { state[t] = []; isSample[t] = false; }
    const local = Object.assign({ id: 'local-' + now(), created_at: new Date().toISOString() }, row);
    state[t].unshift(local); renderAll();
    if (DEMO || !sb) return toast(msg + ' (demo, not saved)');
    const { data, error } = await sb.from(t).insert(row).select().single();
    state[t] = state[t].filter((r) => r !== local);
    if (error) { renderAll(); return toast('Could not save: ' + error.message); }
    if (!state[t].some((r) => r.id === data.id)) state[t].unshift(data);
    renderAll(); toast(msg);
  }
  const me = () => $('cc-user').textContent || 'admin';
  function decide(a, status) {
    const words = { approved: 'Approved', changes: 'Sent back for changes', rejected: 'Rejected' };
    updateRow('mgc_approvals', a, { status, decided_by: me(), decided_at: new Date().toISOString() }, words[status]);
  }
  const makeTask = (title, priority) => insertRow('mgc_tasks', { title: title.slice(0, 140), status: 'todo', priority: priority || 'normal' }, 'To-do added');
  const NEXT = { todo: 'doing', doing: 'done', blocked: 'doing', done: 'todo' };
  function advance(task) {
    const s = NEXT[lc(task.status)] || 'doing';
    updateRow('mgc_tasks', task, { status: s, completed_at: s === 'done' ? new Date().toISOString() : null }, 'Moved to ' + (s === 'todo' ? 'To do' : s[0].toUpperCase() + s.slice(1)));
  }
  function approvalButtons(a) {
    if (lc(a.status) !== 'pending') return el('span', { class: 'cc-pill ' + lc(a.status), text: a.status || '' });
    const b = (label, cls, s) => { const x = el('button', { type: 'button', class: 'cc-act ' + cls, text: label }); x.addEventListener('click', () => decide(a, s)); return x; };
    return el('div', { class: 'cc-acts' }, [b('Approve', 'ok', 'approved'), b('Changes', 'warn', 'changes'), b('Reject', 'no', 'rejected')]);
  }
  const btn = (label, fn, cls) => { const x = el('button', { type: 'button', class: 'cc-act ' + (cls || ''), text: label }); x.addEventListener('click', fn); return x; };

  // ── Delivery, ideas, approvals (actionable) ──
  function renderDelivery() {
    const T = now();
    const projects = state.mgc_projects.filter((p) => !['done', 'complete', 'completed', 'cancelled'].includes(lc(p.status))).slice(0, 8);
    $('cc-projects').replaceChildren(...(projects.length ? projects.map((p) => {
      const pct = Math.max(0, Math.min(100, Number(p.progress) || 0));
      return el('li', {}, [
        el('div', { class: 'cc-proj-top' }, [el('span', {}, [document.createTextNode(p.title || 'Untitled'), el('small', { text: '  ' + (p.company || p.client_name || '') })]), el('small', { text: pct + '%' + (p.due_date ? ' · due ' + fmtDay(ts(p.due_date)) : '') })]),
        el('div', { class: 'cc-progress' }, [el('span', { style: `width:${pct}%` })]),
      ]);
    }) : [el('li', { class: 'cc-empty', text: 'No active projects.' })]));
    markSample($('cc-projects').closest('.cc-card'), ['mgc_projects']);

    const names = {}; state.mgc_staff.forEach((s) => (names[s.id] = s.name));
    const cols = [['todo', 'To do'], ['doing', 'Doing'], ['blocked', 'Blocked'], ['done', 'Done']];
    const prio = { urgent: 0, high: 1, normal: 2, low: 3 };
    $('cc-tasks').replaceChildren(...cols.map(([k, label]) => {
      const items = state.mgc_tasks.filter((t) => lc(t.status) === k).sort((a, b) => (prio[a.priority] ?? 2) - (prio[b.priority] ?? 2) || ts(a.due_date) - ts(b.due_date));
      return el('div', { class: 'cc-task-col' }, [el('h3', {}, [el('span', { text: label }), el('span', { text: String(items.length) })])].concat(items.slice(0, 8).map((t) => {
        const overdue = k !== 'done' && t.due_date && ts(t.due_date) < T - DAY / 2;
        const n = el('button', { type: 'button', class: 'cc-task ' + lc(t.priority) + (overdue ? ' overdue' : ''), title: 'Move to ' + NEXT[k] }, [document.createTextNode(t.title), el('small', { text: [names[t.assignee_id], t.priority && t.priority !== 'normal' ? t.priority : null, t.due_date ? (overdue ? 'overdue ' : 'due ') + fmtDay(ts(t.due_date)) : null].filter(Boolean).join(' · ') })]);
        n.addEventListener('click', () => advance(t));
        return n;
      })));
    }));
    markSample($('cc-tasks').closest('.cc-card'), ['mgc_tasks']);
    const open = state.mgc_tasks.filter((t) => lc(t.status) !== 'done').length;
    $('cc-task-count').textContent = String(open); $('cc-task-count').classList.toggle('zero', !open);
  }

  function renderIdeas() {
    const items = state.mgc_intake_ideas.filter((i) => lc(i.status) !== 'dismissed').sort((a, b) => created(b) - created(a)).slice(0, 8);
    $('cc-ideas').replaceChildren(...(items.length ? items.map((it) => el('div', { class: 'cc-intake' }, [
      el('div', { class: 'cc-intake-head' }, [el('b', { text: it.company || 'New intake' }), el('time', { text: (lc(it.status) === 'reviewed' ? 'Reviewed · ' : '') + ago(created(it)) })]),
      el('div', { class: 'cc-idea-grid' }, (Array.isArray(it.ideas) ? it.ideas : []).slice(0, 4).map((d, i) => el('div', { class: 'cc-idea' }, [
        el('span', { class: 'cc-idea-n', text: 'IDEA 0' + (i + 1) }), el('strong', { text: d.title || '' }), el('p', { text: d.why || '' }),
        el('p', { class: 'step', text: d.first_step ? 'First step: ' + d.first_step : '' }),
        el('div', { class: 'cc-acts' }, [d.service_line ? el('span', { class: 'cc-pill', text: d.service_line }) : null, btn('Make to-do', () => makeTask((it.company ? it.company + ': ' : '') + (d.first_step || d.title)))]),
      ]))),
      el('div', { class: 'cc-acts' }, [
        lc(it.status) === 'reviewed' ? null : btn('Mark reviewed', () => updateRow('mgc_intake_ideas', it, { status: 'reviewed' }, 'Marked reviewed'), 'ok'),
        btn('Dismiss', () => updateRow('mgc_intake_ideas', it, { status: 'dismissed' }, 'Dismissed'), 'no'),
      ]),
    ])) : [el('p', { class: 'cc-empty', text: 'Ideas appear here a few seconds after each new intake.' })]));
    markSample($('cc-ideas').closest('.cc-card'), ['mgc_intake_ideas']);
    const fresh = state.mgc_intake_ideas.filter((i) => lc(i.status) === 'new').length;
    $('cc-idea-count').textContent = String(fresh); $('cc-idea-count').classList.toggle('zero', !fresh);
  }

  function approvalItem(a) {
    return el('li', {}, [
      el('div', {}, [document.createTextNode((a.agent || 'Agent') + ': ' + String(a.kind || '').replace(/_/g, ' ')), el('small', { text: ((a.payload && (a.payload.summary || a.payload.subject)) || '') + ' · ' + ago(created(a)) })]),
      approvalButtons(a),
    ]);
  }
  function renderQueues() {
    const sorted = state.mgc_approvals.slice().sort((a, b) => (lc(a.status) === 'pending' ? 0 : 1) - (lc(b.status) === 'pending' ? 0 : 1) || created(b) - created(a));
    $('cc-approvals').replaceChildren(...(sorted.length ? sorted.slice(0, 12).map(approvalItem) : [el('li', { class: 'cc-empty', text: 'Nothing waiting on you.' })]));
    const pend = sorted.filter((a) => lc(a.status) === 'pending');
    $('cc-approvals-mini').replaceChildren(...(pend.length ? pend.slice(0, 4).map(approvalItem) : [el('li', { class: 'cc-empty', text: 'Nothing waiting on you.' })]));
    $('cc-approval-count').textContent = String(pend.length); $('cc-approval-count').classList.toggle('zero', !pend.length);
    markSample($('cc-approvals').closest('.cc-card'), ['mgc_approvals']);
    markSample($('cc-approvals-mini').closest('.cc-card'), ['mgc_approvals']);

    const inv = state.mgc_invoices.slice().sort((a, b) => created(b) - created(a)).slice(0, 10);
    table('cc-invoices', ['Client', 'Amount', 'Status', 'Due'], inv.map((r) => [
      [r.company || r.client_name || r.title || 'Invoice', el('small', { text: r.title || r.description || '' })], usd(invCents(r)),
      el('span', { class: 'cc-pill ' + (isOverdue(r) ? 'overdue' : invStatus(r)), text: isOverdue(r) ? 'overdue' : invStatus(r) }), r.due_date ? fmtDay(ts(r.due_date)) : '—',
    ]), [1]);
    markSample($('cc-invoices').closest('.cc-card'), ['mgc_invoices']);
  }

  // ── Live inbox: Slack + forms + chats + bookings + agents ──
  const SOURCES = [['all', 'All', '#FFFFFF'], ['slack', 'Slack', '#A78BFA'], ['form', 'Forms', '#FFB347'], ['chat', 'TrueAssist', '#00D4FF'], ['booking', 'Bookings', '#1A8FD1'], ['agent', 'Agents', '#2DD4BF']];
  const SRC_COLOR = Object.fromEntries(SOURCES.map((s) => [s[0], s[2]]));
  const isSlack = (e) => lc(e.event).includes('slack') || lc(e.agent) === 'slack';
  const leadSrc = (l) => (lc(l.source).includes('trueassist') || lc(l.source).includes('chat') ? 'chat' : lc(l.source).includes('book') ? 'booking' : 'form');
  const initials = (s) => String(s || '?').replace(/[^A-Za-z0-9 #]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  let inboxFilter = 'all', inboxQuery = '';
  const seenInbox = new Set();
  function inboxItems() {
    const items = [];
    state.mgc_leads.forEach((l) => items.push({ key: 'l' + l.id, src: leadSrc(l), who: l.company || l.name || l.email || 'New lead', tag: l.source || 'lead', text: [l.interest, l.message].filter(Boolean).join(' · '), at: created(l), acts: () => [btn('Make follow-up to-do', () => makeTask('Follow up: ' + (l.company || l.name || l.email || 'new lead'), 'high'))] }));
    state.mgc_questionnaires.forEach((q) => {
      const who = q.company || q.client_name || 'Intake questionnaire';
      const text = [q.q1, q.q2].filter(Boolean).join(' · ').slice(0, 260);
      items.push({ key: 'q' + q.id, src: 'form', who, tag: q.reviewed ? 'questionnaire · reviewed' : 'questionnaire', text, at: created(q), acts: () => [btn('Make review to-do', () => makeTask('Review intake: ' + who))] });
    });
    state.mgc_bookings.forEach((b) => items.push({ key: 'b' + b.id, src: 'booking', who: b.company || b.name || 'Strategy call booked', tag: 'booking', text: [b.service_line, bookAt(b) ? fmtWhen(bookAt(b)) : null].filter(Boolean).join(' · '), at: created(b), acts: () => [btn('Make prep to-do', () => makeTask('Prep call: ' + (b.company || b.service_line || 'booking') + ' ' + fmtWhen(bookAt(b))))] }));
    state.mgc_agent_events.filter((e) => lc(e.event) !== 'heartbeat').forEach((e) => {
      const slack = isSlack(e);
      items.push({ key: 'e' + e.id, src: slack ? 'slack' : 'agent', who: e.agent || (slack ? 'Slack' : 'Agent'), tag: slack ? 'slack' : String(e.event || '').replace(/_/g, ' '), text: e.detail || '', at: created(e), acts: slack ? () => [btn('Make to-do', () => makeTask((e.agent ? e.agent + ': ' : '') + String(e.detail || '').replace(/^#[\w-]+:\s*/, '').slice(0, 110)))] : null });
    });
    state.mgc_approvals.filter((a) => lc(a.status) === 'pending').forEach((a) => items.push({ key: 'a' + a.id, src: 'agent', who: a.agent || 'Agent', tag: 'needs approval', text: String(a.kind || '').replace(/_/g, ' ') + ((a.payload && a.payload.summary) ? ' · ' + a.payload.summary : ''), at: created(a), acts: () => [approvalButtons(a)] }));
    return items.sort((a, b) => b.at - a.at);
  }
  function renderInbox() {
    const all = inboxItems();
    const counts = {}; all.forEach((i) => (counts[i.src] = (counts[i.src] || 0) + 1));
    $('cc-chips').replaceChildren(...SOURCES.map(([k, label, c]) => {
      const b = el('button', { type: 'button', role: 'tab', class: 'cc-chip', 'aria-selected': String(inboxFilter === k) }, [k === 'all' ? null : el('i', { style: `background:${c}` }), document.createTextNode(label), el('b', { text: String(k === 'all' ? all.length : counts[k] || 0) })]);
      b.addEventListener('click', () => { inboxFilter = k; renderInbox(); });
      return b;
    }));
    const q = inboxQuery.toLowerCase();
    const shown = all.filter((i) => (inboxFilter === 'all' || i.src === inboxFilter) && (!q || (i.who + ' ' + i.text + ' ' + i.tag).toLowerCase().includes(q))).slice(0, 80);
    $('cc-inbox').replaceChildren(...(shown.length ? shown.map((i) => {
      const fresh = seenInbox.size && !seenInbox.has(i.key);
      return el('li', { class: 'cc-msg' + (fresh ? ' new' : '') }, [
        el('div', { class: 'cc-avatar', style: `background:${SRC_COLOR[i.src]}` , text: initials(i.who) }),
        el('div', { class: 'cc-msg-main' }, [
          el('div', { class: 'cc-msg-top' }, [el('b', { text: i.who }), el('span', { class: 'cc-src', style: `color:${SRC_COLOR[i.src]}`, text: i.tag })]),
          i.text ? el('p', { text: i.text }) : null,
          i.acts ? el('div', { class: 'cc-acts' }, i.acts()) : null,
        ]),
        el('time', { text: ago(i.at) }),
      ]);
    }) : [el('li', { class: 'cc-empty', text: 'Nothing matches this filter yet.' })]));
    all.forEach((i) => seenInbox.add(i.key));
    markSample($('cc-inbox').closest('.cc-card'), ['mgc_leads', 'mgc_agent_events', 'mgc_bookings']);
    const today = all.filter((i) => i.at > now() - DAY).length;
    $('cc-inbox-count').textContent = String(today); $('cc-inbox-count').classList.toggle('zero', !today);
  }

  // ── Overview charts ──
  function startOfToday() { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); d.setHours(0, 0, 0, 0); return now() - (new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })) - d); }
  const ICONS = {
    rev: 'M11.8 10.9c-2.3-.6-3-1.2-3-2.1 0-1.1 1-1.9 2.7-1.9 1.8 0 2.4.8 2.5 2.1h2.2c-.1-1.7-1.1-3.3-3.2-3.8V3h-3v2.2C8.1 5.6 6.5 6.9 6.5 8.8c0 2.3 1.9 3.4 4.6 4.1 2.5.6 3 1.5 3 2.4 0 .7-.5 1.8-2.7 1.8-2.1 0-2.9-.9-3-2.1H6.2c.1 2.2 1.8 3.5 3.8 3.9V21h3v-2.1c1.9-.4 3.5-1.5 3.5-3.6 0-2.8-2.4-3.8-4.7-4.4Z',
    intake: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm2 16H8v-2h8v2Zm0-4H8v-2h8v2Zm-3-5V3.5L18.5 9H13Z',
    call: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10Z',
    slack: 'M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z',
  };
  function renderToday() {
    const t0 = startOfToday(), y0 = t0 - DAY;
    const cnt = (rows, f) => [rows.filter((r) => f(r) >= t0).length, rows.filter((r) => within(f(r), y0, t0)).length];
    const paid = state.mgc_invoices.filter((r) => invStatus(r) === 'paid');
    const revT = sum(paid.filter((r) => invPaidAt(r) >= t0), invCents), revY = sum(paid.filter((r) => within(invPaidAt(r), y0, t0)), invCents);
    const [lT, lY] = cnt(state.mgc_leads.concat(state.mgc_questionnaires), created);
    const [bT, bY] = cnt(state.mgc_bookings, created);
    const [sT, sY] = cnt(state.mgc_agent_events.filter((e) => lc(e.event) !== 'heartbeat'), created);
    const d = (a, b) => (a === b ? 'Same as yesterday' : (a > b ? '+' : '') + (a - b).toLocaleString('en-US') + ' vs yesterday');
    const tiles = [
      ['t-gold', ICONS.rev, usd(revT), 'Revenue collected', revT === revY ? 'Same as yesterday' : (revT > revY ? '+' : '-') + usd(Math.abs(revT - revY)) + ' vs yesterday', 'mgc_invoices'],
      ['t-cyan', ICONS.intake, num(lT), 'New intakes', d(lT, lY), 'mgc_leads'],
      ['t-teal', ICONS.call, num(bT), 'Calls booked', d(bT, bY), 'mgc_bookings'],
      ['t-violet', ICONS.slack, num(sT), 'Slack and agent actions', d(sT, sY), 'mgc_agent_events'],
    ];
    $('cc-today').replaceChildren(...tiles.map((t) => el('div', { class: 'cc-tile ' + t[0], 'data-src': t[5] }, [
      el('div', { class: 'cc-tile-icon' }, [svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [svg('path', { d: t[1] })])]),
      el('div', { class: 'cc-tile-v', text: t[2] }), el('div', { class: 'cc-tile-l', text: t[3] }), el('div', { class: 'cc-tile-d', text: t[4] }),
    ])));
    markSample($('cc-today').closest('.cc-card'), ['mgc_leads', 'mgc_bookings', 'mgc_invoices', 'mgc_agent_events']);
  }

  // Shared chart frame: y grid + labels, returns scale helpers.
  function frame(W, H, max, labels, every) {
    const pad = { l: 34, r: 8, t: 10, b: 22 };
    const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
    const kids = [];
    [0, 0.5, 1].forEach((f) => {
      const yy = y(max * f);
      kids.push(svg('line', { x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, stroke: 'rgba(255,255,255,.06)' }));
      const t = svg('text', { x: pad.l - 6, y: yy + 3, 'text-anchor': 'end', class: 'cc-axis' }); t.textContent = compact(max * f); kids.push(t);
    });
    const bw = (W - pad.l - pad.r) / labels.length;
    labels.forEach((l, i) => { if (i % (every || 1)) return; const t = svg('text', { x: pad.l + bw * (i + 0.5), y: H - 6, 'text-anchor': 'middle', class: 'cc-axis' }); t.textContent = l; kids.push(t); });
    return { kids, y, bw, x: (i) => pad.l + bw * (i + 0.5), x0: pad.l, base: H - pad.b };
  }
  const niceMax = (v) => { const m = Math.max(1, v) * 1.15; const p = 10 ** Math.floor(Math.log10(m)); return Math.ceil(m / p) * p; };
  function legend(id, items) { $(id).replaceChildren(...items.map(([n, c]) => el('span', {}, [el('i', { style: `background:${c}` }), document.createTextNode(n)]))); }

  function renderSourceLines() {
    const days = 30, start = now() - days * DAY;
    const lines = [
      ['Forms', '#FFB347', state.mgc_leads.filter((l) => leadSrc(l) === 'form').concat(state.mgc_questionnaires)],
      ['TrueAssist', '#00D4FF', state.mgc_leads.filter((l) => leadSrc(l) === 'chat')],
      ['Bookings', '#1A8FD1', state.mgc_bookings],
      ['Slack', '#A78BFA', state.mgc_agent_events.filter(isSlack)],
    ].map(([n, c, rows]) => [n, c, series(rows, created, days, 1)]);
    // 3-day rolling sum smooths a sparse daily count into a readable trend.
    lines.forEach((l) => (l[2] = l[2].map((_, i, a) => a.slice(Math.max(0, i - 2), i + 1).reduce((x, y) => x + y, 0))));
    const labels = Array.from({ length: days }, (_, i) => fmtDay(start + (i + 1) * DAY));
    const W = 560, H = 210, max = niceMax(Math.max(...lines.flatMap((l) => l[2])));
    const f = frame(W, H, max, labels, 6);
    lines.forEach(([n, c, v]) => {
      const pts = v.map((val, i) => [f.x(i), f.y(val)]);
      let d = 'M' + pts[0][0] + ' ' + pts[0][1];
      for (let i = 1; i < pts.length; i++) { const mx = (pts[i - 1][0] + pts[i][0]) / 2; d += ` C${mx} ${pts[i - 1][1]} ${mx} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`; }
      f.kids.push(svg('path', { d, fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round' }));
      const last = pts[pts.length - 1]; f.kids.push(svg('circle', { cx: last[0], cy: last[1], r: 3.5, fill: c }));
    });
    $('cc-source-lines').replaceChildren(svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cc-sm', preserveAspectRatio: 'none', role: 'img', 'aria-label': 'Intakes by source, 3-day rolling count' }, f.kids));
    legend('cc-source-legend', lines.map((l) => [l[0], l[1]]));
    markSample($('cc-source-lines').closest('.cc-card'), ['mgc_leads', 'mgc_agent_events']);
  }

  function renderWeekdayBars() {
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const from = now() - 28 * DAY;
    const by = (rows) => { const a = new Array(7).fill(0); rows.forEach((r) => { const t = created(r); if (t > from) a[(new Date(t).getDay() + 6) % 7]++; }); return a; };
    const leads = by(state.mgc_leads.concat(state.mgc_questionnaires)), books = by(state.mgc_bookings);
    const W = 420, H = 210, max = niceMax(Math.max(...leads, ...books));
    const f = frame(W, H, max, names, 1);
    names.forEach((_, i) => {
      [[leads[i], '#00D4FF', -1], [books[i], '#2DD4BF', 1]].forEach(([v, c, s]) => {
        const w = f.bw * 0.22, x = f.x(i) + (s < 0 ? -w - 2 : 2);
        const r = svg('rect', { x, y: f.y(v), width: w, height: Math.max(0, f.base - f.y(v)), rx: 3, fill: c });
        const tt = svg('title'); tt.textContent = names[i] + ': ' + v; r.append(tt); f.kids.push(r);
      });
    });
    $('cc-weekday-bars').replaceChildren(svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cc-sm', preserveAspectRatio: 'none', role: 'img', 'aria-label': 'Intakes and booked calls by weekday' }, f.kids));
    legend('cc-weekday-legend', [['Intakes', '#00D4FF'], ['Booked calls', '#2DD4BF']]);
    markSample($('cc-weekday-bars').closest('.cc-card'), ['mgc_leads', 'mgc_bookings']);
  }

  function renderAgentArea() {
    const hours = 24, start = now() - hours * 3600e3;
    const ev = state.mgc_agent_events.filter((e) => lc(e.event) !== 'heartbeat' && created(e) > start);
    const bucket = (rows) => { const a = new Array(hours).fill(0); rows.forEach((e) => a[Math.min(hours - 1, Math.floor((created(e) - start) / 3600e3))]++); return a; };
    const agents = bucket(ev.filter((e) => !isSlack(e))), slack = bucket(ev.filter(isSlack));
    const labels = Array.from({ length: hours }, (_, i) => new Date(start + (i + 1) * 3600e3).toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'America/New_York' }));
    const W = 420, H = 210, max = niceMax(Math.max(...agents.map((v, i) => v + slack[i])));
    const f = frame(W, H, max, labels, 6);
    const area = (vals, base, c, id) => {
      const top = vals.map((v, i) => [f.x(i), f.y(v + (base ? base[i] : 0))]);
      const bot = vals.map((_, i) => [f.x(i), f.y(base ? base[i] : 0)]).reverse();
      f.kids.push(svg('defs', {}, [svg('linearGradient', { id, x1: 0, x2: 0, y1: 0, y2: 1 }, [svg('stop', { offset: 0, 'stop-color': c, 'stop-opacity': '.55' }), svg('stop', { offset: 1, 'stop-color': c, 'stop-opacity': '.08' })])]));
      f.kids.push(svg('path', { d: 'M' + top.concat(bot).map((p) => p.join(' ')).join(' L') + ' Z', fill: `url(#${id})` }));
      f.kids.push(svg('path', { d: 'M' + top.map((p) => p.join(' ')).join(' L'), fill: 'none', stroke: c, 'stroke-width': 1.8 }));
    };
    area(agents, null, '#2DD4BF', 'cc-ag'); area(slack, agents, '#A78BFA', 'cc-sl');
    $('cc-agent-area').replaceChildren(svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cc-sm', preserveAspectRatio: 'none', role: 'img', 'aria-label': 'Agent and Slack activity per hour' }, f.kids));
    legend('cc-agent-legend', [['Agent runs and requests', '#2DD4BF'], ['Slack posts', '#A78BFA']]);
    markSample($('cc-agent-area').closest('.cc-card'), ['mgc_agent_events']);
  }

  function getTarget() { try { return Number(localStorage.getItem('cc-target')) || 0; } catch { return 0; } }
  function renderTarget() {
    const target = getTarget() * 100;
    const paid = state.mgc_invoices.filter((r) => invStatus(r) === 'paid');
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() - 5 + i); return d; });
    const vals = months.map((m, i) => { const end = i < 5 ? months[i + 1].getTime() : now() + 1; return sum(paid.filter((r) => within(invPaidAt(r), m.getTime(), end)), invCents); });
    const labels = months.map((m) => m.toLocaleDateString('en-US', { month: 'short' }));
    const W = 420, H = 190, max = niceMax(Math.max(target, ...vals));
    const f = frame(W, H, max, labels, 1);
    f.kids.forEach((k) => { if (k.tagName === 'text' && /^[\d.]+[KMB]?$/.test(k.textContent)) k.textContent = '$' + compact(Number(k.textContent.replace(/[KMB]/, '')) * ({ K: 1e3, M: 1e6, B: 1e9 }[k.textContent.slice(-1)] || 1) / 100); });
    vals.forEach((v, i) => {
      const hit = target && v >= target;
      const r = svg('rect', { x: f.x(i) - f.bw * 0.16, y: f.y(v), width: f.bw * 0.32, height: Math.max(0, f.base - f.y(v)), rx: 4, fill: hit ? '#22C55E' : '#FFB347' });
      const tt = svg('title'); tt.textContent = labels[i] + ': ' + usd(v); r.append(tt); f.kids.push(r);
    });
    if (target) f.kids.push(svg('line', { x1: f.x0, x2: W - 8, y1: f.y(target), y2: f.y(target), stroke: '#00D4FF', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }));
    $('cc-target-bars').replaceChildren(svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cc-sm', preserveAspectRatio: 'none', role: 'img', 'aria-label': 'Monthly revenue against target' }, f.kids));
    const pct = target ? Math.min(100, Math.round((vals[5] / target) * 100)) : 0;
    const C = 2 * Math.PI * 18;
    $('cc-target-month').replaceChildren(
      svg('svg', { viewBox: '0 0 46 46', 'aria-hidden': 'true' }, [svg('circle', { cx: 23, cy: 23, r: 18, fill: 'none', stroke: 'rgba(255,255,255,.08)', 'stroke-width': 5 }), svg('circle', { cx: 23, cy: 23, r: 18, fill: 'none', stroke: '#00D4FF', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': `${(pct / 100) * C} ${C}`, transform: 'rotate(-90 23 23)' })]),
      el('div', {}, [el('b', { text: target ? pct + '%' : usd(vals[5]) }), document.createTextNode(target ? 'of this month\'s target' : 'this month. Set a target to track it.')]));
    markSample($('cc-target-bars').closest('.cc-card'), ['mgc_invoices']);
  }

  function renderBanner() {
    const n = TABLES.filter((t) => isSample[t]).length;
    $('cc-sample-banner').hidden = n === 0;
    $('cc-sample-text').textContent = DEMO
      ? 'Demo mode: every number on this page is SAMPLE data, and buttons change only this page.'
      : n + ' of ' + TABLES.length + ' data sources have no rows yet. Cards marked SAMPLE show placeholder data until real rows arrive.';
  }

  function renderAll() {
    [renderToday, renderSourceLines, renderKpis, renderWeekdayBars, renderAgentArea, renderTarget, renderRevenue, renderFunnel, renderWorkforce, renderModels, renderDelivery, renderIdeas, renderQueues, renderInbox, renderBanner, renderPulseStats]
      .forEach((f) => { try { f(); } catch (e) { console.error('Command Center render:', f.name, e); } });
    dispatchEvent(new Event('cc:render'));
  }

  // ── Navigation ──
  const VIEW_TITLES = { overview: 'Command overview', inbox: 'Live inbox', workforce: 'Staff and agents', models: 'Models and usage', delivery: 'Projects and to-dos', ideas: 'Intake ideas', finance: 'Revenue and approvals' };
  function showView(v) {
    if (!VIEW_TITLES[v]) v = 'overview';
    document.querySelectorAll('.cc-view').forEach((s) => (s.hidden = s.dataset.view !== v));
    document.querySelectorAll('#cc-nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
    $('cc-view-title').textContent = VIEW_TITLES[v];
    setSide(false);
    if (location.hash.slice(1) !== v) history.replaceState(null, '', '#' + v);
    if ($('cc-view-title').dataset.v === v) return;
    $('cc-view-title').dataset.v = v;
    dispatchEvent(new CustomEvent('cc:view', { detail: { view: v } }));
    window.scrollTo(0, 0);
    if (v === 'overview') dispatchEvent(new Event('resize'));
  }
  function setSide(open) { $('cc-side').classList.toggle('open', open); $('cc-scrim').hidden = !open; }
  function initUi() {
    document.querySelectorAll('#cc-nav button, [data-go]').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view || b.dataset.go)));
    $('cc-burger').addEventListener('click', () => setSide(true));
    $('cc-scrim').addEventListener('click', () => setSide(false));
    $('cc-search').addEventListener('input', (e) => { inboxQuery = e.target.value; renderInbox(); });
    $('cc-add-task').addEventListener('submit', (e) => { e.preventDefault(); const v = $('cc-new-task').value.trim(); if (!v) return; makeTask(v, $('cc-new-prio').value); $('cc-new-task').value = ''; });
    const tgt = $('cc-target'); tgt.value = getTarget() || '';
    tgt.addEventListener('change', () => { try { localStorage.setItem('cc-target', String(Math.max(0, Number(tgt.value) || 0))); } catch {} renderTarget(); });
    addEventListener('hashchange', () => showView(location.hash.slice(1)));
    showView(location.hash.slice(1));
  }

  let renderTimer = null;
  const scheduleRender = () => { clearTimeout(renderTimer); renderTimer = setTimeout(renderAll, 250); };

  // ── Heartbeat (ECG) ──
  function Ecg(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, samples = [], pending = [], last = 0;
    const speed = opts.speed || 2;
    function size() { dpr = devicePixelRatio || 1; w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function wave(t) { // PQRST shape, t in 0..1, returns -1..1
      const g = (c, s, a) => a * Math.exp(-((t - c) ** 2) / (2 * s * s));
      return g(0.12, 0.03, 0.12) - g(0.3, 0.012, 0.14) + g(0.35, 0.014, 1) - g(0.4, 0.014, 0.28) + g(0.62, 0.06, 0.22);
    }
    this.beat = (amp, color) => { const n = opts.beatLen || 70; for (let i = 0; i < n; i++) pending.push({ y: wave(i / n) * amp, c: color }); };
    function step() {
      for (let i = 0; i < speed; i++) samples.push(pending.length ? pending.shift() : { y: (Math.random() - 0.5) * 0.012, c: null });
      if (samples.length > w) samples.splice(0, samples.length - w);
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const mid = h * (opts.mid || 0.58), amp = h * (opts.amp || 0.42);
      ctx.lineWidth = opts.line || 2; ctx.lineJoin = 'round';
      let i0 = 0;
      while (i0 < samples.length - 1) { // draw runs of the same color
        const col = samples[i0].c || opts.color; let i1 = i0;
        while (i1 < samples.length - 1 && (samples[i1 + 1].c || opts.color) === col) i1++;
        ctx.beginPath(); ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = opts.glow || 10;
        const x0 = w - samples.length;
        for (let i = i0; i <= Math.min(i1 + 1, samples.length - 1); i++) { const x = x0 + i, y = mid - samples[i].y * amp; i === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke(); i0 = i1 + 1;
      }
      const lastS = samples[samples.length - 1];
      if (lastS) { ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.shadowColor = opts.color; ctx.shadowBlur = 16; ctx.arc(w - 1, mid - lastS.y * amp, opts.dot || 3, 0, Math.PI * 2); ctx.fill(); }
    }
    function loop(t) {
      if (t - last > 16) { step(); draw(); last = t; }
      requestAnimationFrame(loop);
    }
    size(); addEventListener('resize', size);
    samples = Array.from({ length: Math.ceil(w) }, () => ({ y: 0, c: null }));
    if (REDUCED) { for (let k = 0; k < 6; k++) { this.beat(0.6, null); for (let i = 0; i < 40; i++) pending.push({ y: 0, c: null }); } while (pending.length) step(); draw(); this.beat = () => {}; }
    else requestAnimationFrame(loop);
  }
  let ecg, strip;
  function startHeart() {
    ecg = new Ecg($('cc-ecg'), { color: '#00D4FF', speed: 2, beatLen: 70, amp: 0.4 });
    strip = new Ecg($('cc-strip'), { color: 'rgba(0,212,255,.75)', speed: 1, beatLen: 40, amp: 0.45, line: 1.4, glow: 6, dot: 2, mid: 0.6 });
    // Resting rhythm, about 60 bpm; real events add colored beats on top.
    setInterval(() => { ecg.beat(0.35, null); strip.beat(0.3, null); }, 1000);
    $('cc-heart-legend').replaceChildren(...['mgc_leads', 'mgc_bookings', 'mgc_invoices', 'mgc_approvals', 'mgc_agent_events', 'mgc_model_usage', 'mgc_tasks'].map((t) => el('span', {}, [el('i', { style: `background:${COLORS[t]}` }), document.createTextNode(LABELS[t])])), el('span', {}, [el('i', { style: 'background:#A78BFA' }), document.createTextNode('Slack')]));
  }
  function renderPulseStats() {
    const T = now();
    let n = state.mgc_agent_events.filter((r) => created(r) > T - 3600e3).length;
    ['mgc_leads', 'mgc_bookings', 'mgc_invoices', 'mgc_approvals', 'mgc_model_usage', 'mgc_tasks'].forEach((t) => (n += state[t].filter((r) => created(r) > T - 3600e3).length));
    $('cc-bpm').textContent = String(n);
    markSample($('cc-ecg').closest('.cc-card'), ['mgc_agent_events']);
  }

  // ── Activity feed ──
  const feed = [];
  function describe(t, r, type) {
    const verb = type === 'UPDATE' ? 'updated' : type === 'DELETE' ? 'removed' : 'new';
    switch (t) {
      case 'mgc_leads': return [`${verb === 'new' ? 'New lead' : 'Lead ' + verb}: ${r.company || r.name || r.email || ''}`, r.interest || r.source || ''];
      case 'mgc_bookings': return [`Booking ${verb === 'new' ? 'made' : verb}`, (r.service_line || '') + (bookAt(r) ? ' · ' + fmtWhen(bookAt(r)) : '')];
      case 'mgc_invoices': return [`Invoice ${invStatus(r) || verb}: ${usd(invCents(r))}`, r.company || r.title || ''];
      case 'mgc_approvals': return [`${r.agent || 'Agent'} ${lc(r.status) === 'pending' ? 'asks for approval' : lc(r.status)}`, String(r.kind || '').replace(/_/g, ' ')];
      case 'mgc_agent_events': return lc(r.event).includes('slack') ? [`Slack: ${r.agent || 'message'}`, r.detail || ''] : [`${r.agent || 'Agent'}: ${String(r.event || '').replace(/_/g, ' ')}`, r.detail || ''];
      case 'mgc_questionnaires': return [`New questionnaire: ${r.company || r.client_name || ''}`, r.q1 || ''];
      case 'mgc_intake_ideas': return [`4 ideas ready for ${r.company || 'new intake'}`, 'Intake Agent'];
      case 'mgc_model_usage': return [`Model call: ${(r.model || '').replace('claude-', '')}`, (r.source || '') + ' · ' + compact((r.input_tokens || 0) + (r.output_tokens || 0)) + ' tokens'];
      case 'mgc_tasks': return [`Task ${lc(r.status) === 'done' ? 'done' : verb}: ${r.title || ''}`, r.priority || ''];
      case 'mgc_client_profiles': return [`Client ${verb}: ${r.company || r.full_name || ''}`, stage(r)];
      default: return [`${LABELS[t] || t} ${verb}`, ''];
    }
  }
  function pushFeed(t, r, type, at, fresh) {
    const [title, detail] = describe(t, r, type);
    feed.unshift({ t, title, detail, at: at || now(), fresh });
    feed.sort((a, b) => b.at - a.at); feed.length = Math.min(feed.length, 30);
  }
  function renderFeed() {
    $('cc-feed').replaceChildren(...(feed.length ? feed.map((f) => {
      const li = el('li', { class: f.fresh ? 'new' : '' }, [el('i', { style: `background:${COLORS[f.t] || '#00D4FF'}` }), el('div', {}, [el('b', { text: f.title }), f.detail ? el('div', { class: 'muted', text: f.detail }) : null]), el('time', { text: ago(f.at) })]);
      f.fresh = false; return li;
    }) : [el('li', { class: 'cc-empty', text: 'Waiting for activity.' })]));
  }
  function seedFeed() {
    ['mgc_agent_events', 'mgc_leads', 'mgc_questionnaires', 'mgc_bookings', 'mgc_invoices', 'mgc_approvals', 'mgc_intake_ideas'].forEach((t) => state[t].slice().sort((a, b) => created(b) - created(a)).slice(0, 6).forEach((r) => pushFeed(t, r, 'INSERT', created(r))));
    renderFeed();
  }

  // ── Realtime ──
  function blip(t) {
    document.querySelectorAll('[data-src]').forEach((n) => {
      if (n.getAttribute('data-src').split(' ').includes(t)) { n.classList.add('blip'); setTimeout(() => n.classList.remove('blip'), 1400); }
    });
  }
  function onChange(t, type, row, old) {
    if (isSample[t]) { state[t] = []; isSample[t] = false; }
    const list = state[t];
    const key = (row && row.id) ?? (old && old.id);
    const i = list.findIndex((r) => r.id === key);
    if (type === 'DELETE') { if (i >= 0) list.splice(i, 1); }
    else if (i >= 0) list[i] = row; else list.unshift(row);
    if (t !== 'mgc_model_usage' || type === 'INSERT') {
      const big = ['mgc_leads', 'mgc_invoices', 'mgc_approvals', 'mgc_intake_ideas', 'mgc_bookings'].includes(t);
      const col = t === 'mgc_agent_events' && row && isSlack(row) ? '#A78BFA' : COLORS[t];
      ecg.beat(big ? 1 : 0.7, col); strip.beat(big ? 0.9 : 0.6, col);
    }
    pushFeed(t, row || old || {}, type, now(), true); renderFeed(); blip(t); scheduleRender();
    dispatchEvent(new CustomEvent('cc:event', { detail: { table: t, type, row: row || old || {} } }));
  }
  function setLive(mode, label) {
    const n = $('cc-live'); n.classList.toggle('on', mode === 'on'); n.classList.toggle('demo', mode === 'demo');
    $('cc-live-label').textContent = label;
  }
  function subscribe() {
    let ch = sb.channel('mgc-command-center');
    TABLES.forEach((t) => { ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, (p) => onChange(t, p.eventType, p.new && Object.keys(p.new).length ? p.new : null, p.old)); });
    ch.subscribe((status) => setLive(status === 'SUBSCRIBED' ? 'on' : 'off', status === 'SUBSCRIBED' ? 'Live' : status === 'CHANNEL_ERROR' ? 'Realtime off' : 'Connecting'));
  }
  // Demo only: simulated sample events so the pulse can be seen without live data.
  function simulate() {
    const r = rng(7); const T = () => new Date().toISOString();
    const make = [
      () => ['mgc_agent_events', { id: 'sim' + Math.random(), agent: 'Intake Agent', event: 'run', detail: 'Scored a new lead', created_at: T() }],
      () => ['mgc_agent_events', { id: 'sim' + Math.random(), agent: 'Billing Agent', event: 'approval_requested', detail: 'Payment reminder draft', created_at: T() }],
      () => ['mgc_leads', { id: 'sim' + Math.random(), company: 'Sample: Glen Burnie Auto', interest: 'Automation', source: 'trueassist', status: 'new', created_at: T() }],
      () => ['mgc_model_usage', { id: 'sim' + Math.random(), source: 'trueassist', model: 'claude-haiku-4-5', input_tokens: 1800, output_tokens: 420, cost_cents: 0.39, created_at: T() }],
      () => ['mgc_agent_events', { id: 'sim' + Math.random(), agent: 'Strategy Lead', event: 'slack_message', detail: '#site-inquiries: new TrueAssist lead looks like a fit for the CRM rebuild', created_at: T() }],
      () => ['mgc_questionnaires', { id: 'sim' + Math.random(), company: 'Sample: Ellicott City Florist', q1: 'Two-location florist', q2: 'Wedding inquiries pile up in three inboxes', created_at: T() }],
      () => ['mgc_tasks', { id: 'sim' + Math.random(), title: 'Follow up on intake ideas', status: 'todo', priority: 'high', created_at: T() }],
    ];
    const tick = () => { const [t, row] = make[Math.floor(r() * make.length)](); state[t].unshift(row); const col = t === 'mgc_agent_events' && isSlack(row) ? '#A78BFA' : COLORS[t]; ecg.beat(0.9, col); strip.beat(0.8, col); pushFeed(t, row, 'INSERT', now(), true); renderFeed(); blip(t); scheduleRender(); dispatchEvent(new CustomEvent('cc:event', { detail: { table: t, type: 'INSERT', row } })); setTimeout(tick, 2500 + r() * 4000); };
    setTimeout(tick, 1500);
  }

  window.CC = { state, isSample, demo: DEMO, go: (v) => showView(v), isSlack: (e) => isSlack(e), leadSrc: (l) => leadSrc(l), approve: (a, s) => decide(a, s) };

  // ── Boot + auth ──
  function clock() { $('cc-clock').textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'; }
  let booted = false;
  async function boot(email) {
    if (booted) return; booted = true;
    $('cc-auth').hidden = true; $('cc-app').hidden = false;
    $('cc-user').textContent = email || '';
    clock(); setInterval(clock, 15000);
    initUi();
    startHeart();
    await loadAll();
    renderAll(); seedFeed();
    setInterval(() => { renderFeed(); renderPulseStats(); }, 30000);
    if (DEMO) { setLive('demo', 'Demo'); simulate(); } else subscribe();
  }
  const authErr = (m) => ($('cc-auth-err').textContent = m || '');

  if (DEMO) { $('cc-signout').hidden = true; boot('Demo mode'); return; }

  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  const allowed = (u) => u && u.email && ADMIN_EMAILS.includes(u.email.toLowerCase());
  sb.auth.getSession().then(({ data }) => {
    const u = data.session && data.session.user;
    if (allowed(u)) boot(u.email); else if (u) authErr('This account does not have admin access.');
  });
  $('cc-auth-form').addEventListener('submit', async (e) => {
    e.preventDefault(); authErr('');
    const email = $('cc-email').value.trim().toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) return authErr('This account does not have admin access.');
    const { data, error } = await sb.auth.signInWithPassword({ email, password: $('cc-pass').value });
    if (error) return authErr(error.message);
    boot(data.user.email);
  });
  $('cc-signout').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });
})();
