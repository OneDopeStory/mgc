/* TrueAssist visitor widget (home page).
 * Talks to /api/chat (netlify.toml rewrite to the trueassist function).
 *   POST { messages, session_id, session_token } -> { reply, mode, relay, session_id, session_token? }
 *   GET  ?session_id&session_token&after -> { mode, messages } (team replies relayed from Slack)
 * Vanilla JS, no framework.
 * All text, including model replies, is written with textContent. Never innerHTML.
 */
(function () {
  'use strict';

  var ENDPOINT = '/api/chat';
  var MAX_CHARS = 1000;
  var MAX_TURNS = 20;
  var STORE_KEY = 'mgc_trueassist_history';
  var SESSION_KEY = 'mgc_trueassist_session';
  var POLL_MS = 6000;
  var POLL_IDLE_LIMIT_MS = 30 * 60 * 1000; // stop polling after 30 min without activity
  var WELCOME = 'Hi, I am TrueAssist, MGC’s AI advisor. Ask about AI strategy, automation, CRM design, or what working with MGC looks like. Signed-in clients can ask about their own projects in the client portal.';
  var FALLBACK = 'TrueAssist is unavailable right now. Email info@mgcglobalconsulting.com or book a session at /book.';

  var root = document.getElementById('ta-widget');
  if (!root) return;

  var log = document.getElementById('ta-log');
  var form = document.getElementById('ta-form');
  var input = document.getElementById('ta-input');
  var sendBtn = document.getElementById('ta-send');
  var resetBtn = document.getElementById('ta-reset');
  var counter = document.getElementById('ta-count');
  var status = document.getElementById('ta-status');

  input.setAttribute('maxlength', String(MAX_CHARS));
  var pending = false;
  var history = loadHistory();
  var session = loadSession();
  var pollTimer = null;
  var lastActivity = Date.now();

  function isTurn(m) {
    return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim() !== '';
  }

  function loadHistory() {
    try {
      var parsed = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(isTurn).slice(-MAX_TURNS) : [];
    } catch (err) {
      return [];
    }
  }

  function loadSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return s && typeof s.id === 'string' && typeof s.token === 'string' ? s : null;
    } catch (err) {
      return null;
    }
  }

  function saveSession() {
    try {
      if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      /* storage blocked: the session lasts for this page view only */
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_TURNS)));
    } catch (err) {
      /* storage blocked (private window): the chat still works for this page view */
    }
  }

  function addMessage(role, text) {
    var wrap = document.createElement('div');
    wrap.className = 'ta-msg ta-msg-' + role;

    var avatar = document.createElement('div');
    avatar.className = 'ta-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = role === 'user' ? 'You' : role === 'agent' ? 'MGC' : 'TA';

    var bubble = document.createElement('div');
    bubble.className = 'ta-bubble';
    bubble.textContent = text;

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return wrap;
  }

  function setPending(on) {
    pending = on;
    input.disabled = on;
    sendBtn.disabled = on;
    status.textContent = on ? 'TrueAssist is typing' : '';
  }

  function updateCounter() {
    counter.textContent = input.value.length + ' / ' + MAX_CHARS;
  }

  function render() {
    log.textContent = '';
    if (history.length === 0) {
      addMessage('assistant', WELCOME);
      return;
    }
    history.forEach(function (m) {
      addMessage(m.agent ? 'agent' : m.role, m.agent ? m.agent + ': ' + m.content : m.content);
    });
  }

  async function ask(text) {
    if (pending) return;
    var content = String(text || '').trim().slice(0, MAX_CHARS);
    if (!content) return;

    history.push({ role: 'user', content: content });
    addMessage('user', content);
    saveHistory();
    input.value = '';
    updateCounter();
    setPending(true);

    var reply = null;
    var errorText = null;
    try {
      var res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-MAX_TURNS).map(function (m) { return { role: m.role, content: m.content }; }),
          session_id: session ? session.id : undefined,
          session_token: session ? session.token : undefined
        })
      });
      var data = await res.json().catch(function () { return {}; });
      if (typeof data.session_id === 'string' && typeof data.session_token === 'string') {
        session = { id: data.session_id, token: data.session_token, after: 0 };
        saveSession();
      }
      lastActivity = Date.now();
      if (data.relay || data.mode === 'human') startPolling();
      if (res.ok && data.mode === 'human' && data.reply === null) {
        reply = '';
        status.textContent = 'Sent to the MGC team';
      } else if (res.ok && typeof data.reply === 'string' && data.reply.trim() !== '') {
        reply = data.reply;
      } else if (res.status === 429 && typeof data.error === 'string' && data.error.trim() !== '') {
        /* the function's 429 text is written for visitors (daily limit, booking link) */
        errorText = data.error;
      } else {
        /* 5xx and other errors carry internal wording: show the friendly fallback instead */
        errorText = FALLBACK;
      }
    } catch (err) {
      errorText = FALLBACK;
    }

    var keepStatus = reply === '';
    if (reply) {
      history.push({ role: 'assistant', content: reply });
      addMessage('assistant', reply);
    } else if (reply === null) {
      addMessage('error', errorText);
    }
    saveHistory();
    setPending(false);
    if (keepStatus) status.textContent = 'Sent to the MGC team';
    input.focus();
  }

  // Team replies from Slack. Polls only after the chat was handed to the team.
  async function poll() {
    if (!session || document.hidden || pending) return;
    if (Date.now() - lastActivity > POLL_IDLE_LIMIT_MS) return stopPolling();
    try {
      var url = ENDPOINT + '?session_id=' + encodeURIComponent(session.id) +
        '&session_token=' + encodeURIComponent(session.token) + '&after=' + (session.after || 0);
      var res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.status === 404) { session = null; saveSession(); return stopPolling(); }
      if (!res.ok) return;
      var data = await res.json();
      (data.messages || []).forEach(function (m) {
        if (typeof m.content !== 'string' || !m.content.trim()) return;
        var author = typeof m.author === 'string' && m.author ? m.author : 'MGC team';
        history.push({ role: 'assistant', content: m.content, agent: author });
        addMessage('agent', author + ': ' + m.content);
        session.after = Math.max(session.after || 0, Number(m.id) || 0);
        lastActivity = Date.now();
      });
      saveHistory();
      saveSession();
      if (data.mode === 'closed') stopPolling();
    } catch (err) {
      /* network blip: try again on the next tick */
    }
  }

  function startPolling() {
    if (!pollTimer) pollTimer = setInterval(poll, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ask(input.value);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      ask(input.value);
    }
  });

  input.addEventListener('input', updateCounter);

  resetBtn.addEventListener('click', function () {
    if (pending) return;
    history = [];
    session = null;
    stopPolling();
    saveHistory();
    saveSession();
    render();
    input.focus();
  });

  document.querySelectorAll('.ta-chip[data-ta-prompt]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (pending) return;
      ask(chip.getAttribute('data-ta-prompt'));
    });
  });

  render();
  updateCounter();
  if (session && history.some(function (m) { return m.agent; })) startPolling();
})();

/* Launcher / overlay toggle for the assistant window. Separate from the chat
 * logic above so a failure here never blocks TrueAssist itself from working. */
(function () {
  'use strict';

  var panel = document.getElementById('ta-widget');
  var launcher = document.getElementById('ta-launcher');
  var backdrop = document.getElementById('ta-backdrop');
  var collapseBtn = document.getElementById('ta-collapse');
  var openInlineBtn = document.getElementById('ta-open-inline');
  var taInput = document.getElementById('ta-input');
  if (!panel || !launcher || !backdrop) return;

  var TRANSITION_MS = 300;
  var hideTimer = null;

  function open() {
    clearTimeout(hideTimer);
    backdrop.hidden = false;
    panel.hidden = false;
    requestAnimationFrame(function () {
      document.body.classList.add('ta-open');
    });
    launcher.setAttribute('aria-expanded', 'true');
    setTimeout(function () {
      if (taInput) taInput.focus();
    }, TRANSITION_MS);
  }

  function close() {
    document.body.classList.remove('ta-open');
    launcher.setAttribute('aria-expanded', 'false');
    hideTimer = setTimeout(function () {
      backdrop.hidden = true;
      panel.hidden = true;
    }, TRANSITION_MS);
    launcher.focus();
  }

  launcher.addEventListener('click', open);
  if (openInlineBtn) openInlineBtn.addEventListener('click', open);
  if (collapseBtn) collapseBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('ta-open')) close();
  });

  document.querySelectorAll('.ta-chip[data-ta-prompt]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (!document.body.classList.contains('ta-open')) open();
    });
  });
})();
