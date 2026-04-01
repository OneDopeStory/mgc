'use strict';
/**
 * MGC Payment Hub — Main Server
 * ──────────────────────────────
 * Entry point for the QuickBooks → multi-integration webhook server.
 *
 * Start:  node server.js
 *         npm start
 */

require('dotenv').config();

const validateEnv = require('./middleware/validateEnv');
validateEnv();

const express = require('express');
const webhookRouter = require('./routes/webhook');
const log = require('./lib/logger');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── Global middleware ──────────────────────────────────────────────── */

// Request logger
app.use((req, _res, next) => {
  log.info('HTTP', `${req.method} ${req.path}`);
  next();
});

/* ── Routes ─────────────────────────────────────────────────────────── */

app.use('/webhooks', webhookRouter);

// Root health check (mirrors /webhooks/health for load-balancer probes)
app.get('/', (_req, res) => {
  res.json({
    service:   'MGC Payment Hub',
    status:    'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* ── Start ──────────────────────────────────────────────────────────── */

app.listen(PORT, () => {
  log.info('Server', `MGC Payment Hub running on port ${PORT}`);
  log.info('Server', `Webhook endpoint: POST /webhooks/quickbooks`);
  log.info('Server', `Health endpoint:  GET  /webhooks/health`);
});
