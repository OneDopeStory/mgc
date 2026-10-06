'use strict';
/**
 * Slack channel routing and the Command Center activity log, shared by slack-notify,
 * lead-intake and slack-events.
 *
 * Env: SLACK_CHANNEL_MAP  JSON {"inquiries","clients","billing","outreach","approvals","ops"} → channel ID
 *      SLACK_INQUIRIES_CHANNEL_ID  fallback when the map has no entry
 */

const { db, hasServiceRole } = require('./leads');

// Route key → agent name shown on the post (needs chat:write.customize; ignored without it).
const AGENTS = {
  inquiries: 'Intake Agent', clients: 'Client Success Agent', billing: 'Billing Agent',
  outreach: 'Outreach Agent', approvals: 'TrueAssist', ops: 'Ops Monitor',
};

// Route key → channel name, for the activity feed (avoids a conversations.info call per event).
const CHANNEL_NAMES = {
  inquiries: 'site-inquiries', clients: 'clients', billing: 'billing',
  outreach: 'outreach', approvals: 'approvals', ops: 'ops-alerts',
};

function channelMap() {
  try {
    return JSON.parse(process.env.SLACK_CHANNEL_MAP || '{}') || {};
  } catch {
    console.error('[slack-routing] SLACK_CHANNEL_MAP is not valid JSON');
    return {};
  }
}

function channelFor(route) {
  const map = channelMap();
  return map[route] || map.inquiries || process.env.SLACK_INQUIRIES_CHANNEL_ID;
}

// Channel ID → route key, or null when the channel isn't one of MGC's routed channels.
function routeForChannel(channelId) {
  const map = channelMap();
  const hit = Object.entries(map).find(([, id]) => id === channelId);
  if (hit) return hit[0];
  if (channelId && channelId === process.env.SLACK_INQUIRIES_CHANNEL_ID) return 'inquiries';
  return null;
}

// One row in mgc_agent_events per Slack post; feeds the Command Center's live Slack panel.
// Never throws: the activity log must not block a post.
async function logSlackActivity({ agent, route, text, reply = false }) {
  if (!hasServiceRole()) return;
  const name = CHANNEL_NAMES[route] || route || 'slack';
  await db('mgc_agent_events', {
    method: 'POST',
    prefer: 'return=minimal',
    body: {
      agent: String(agent || 'Slack').slice(0, 120),
      event: reply ? 'slack_reply' : 'slack_message',
      detail: `#${name}: ${String(text || '').replace(/\s+/g, ' ').trim().slice(0, 200)}`,
    },
  }).catch(err => console.error('[slack-routing] activity log failed:', err.message));
}

module.exports = { AGENTS, CHANNEL_NAMES, channelFor, routeForChannel, logSlackActivity };
