/**
 * Structured logger — timestamps every line, prefixes with level.
 * Drop-in replacement for console.log that works in production.
 */

const LEVELS = { info: '✅', warn: '⚠️ ', error: '❌', debug: '🔍' };

function log(level, context, message, data = null) {
  const ts = new Date().toISOString();
  const prefix = LEVELS[level] || '  ';
  const line = `[${ts}] ${prefix} [${context}] ${message}`;
  if (data) {
    console[level === 'error' ? 'error' : 'log'](line, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    console[level === 'error' ? 'error' : 'log'](line);
  }
}

module.exports = {
  info:  (ctx, msg, data) => log('info',  ctx, msg, data),
  warn:  (ctx, msg, data) => log('warn',  ctx, msg, data),
  error: (ctx, msg, data) => log('error', ctx, msg, data),
  debug: (ctx, msg, data) => log('debug', ctx, msg, data),
};
