# Alex Dispatch — VPS deploy guide

Files in this folder are deployed to the Hostinger VPS at `/opt/hermes-agent/dispatch/`.

## What this is

`webhook_server.py` is a lightweight HTTP server that:
1. Receives HMAC-SHA256 signed event POSTs from Netlify (`agent-dispatch.js`)
2. Validates signature, deduplicates by event ID, writes to durable queue
3. Invokes `hermes run --prompt "..."` for each event via a background worker
4. Alex (Hermes) processes the prompt and routes to the appropriate staff role

## Required env vars (add to `/data/.env`)

```
ALEX_DISPATCH_SECRET=<generate with: python3 -c "import secrets; print(secrets.token_hex(32))">
HERMES_BIN=hermes
ALEX_QUEUE_DIR=/data/alex-dispatch/queue
ALEX_LOG_DIR=/data/alex-dispatch/logs
ALEX_DISPATCH_PORT=8080
```

The **same `ALEX_DISPATCH_SECRET`** must be set on Netlify as `ALEX_DISPATCH_SECRET`.

Also add these to Netlify env vars:
```
ALEX_DISPATCH_URL=https://agentdispatch.mgcglobalconsulting.com/webhook
ALEX_DISPATCH_SECRET=<same secret as above>
ALEX_DISPATCH_INTERNAL_SECRET=<separate secret for Netlify function-to-function calls>
```

## Deploy steps (run on VPS as root or sudo user)

```bash
# 1. Copy files
mkdir -p /opt/hermes-agent/dispatch
cp webhook_server.py /opt/hermes-agent/dispatch/
cp alex-dispatch.service /etc/systemd/system/

# 2. Create service user if needed
id hermes || useradd -r -s /bin/false hermes

# 3. Create queue/log dirs with correct ownership
mkdir -p /data/alex-dispatch/{queue,logs}
chown -R hermes:hermes /data/alex-dispatch

# 4. Add secrets to /data/.env (not committed to git)
echo "ALEX_DISPATCH_SECRET=<your-secret>" >> /data/.env
echo "HERMES_BIN=hermes"                 >> /data/.env
echo "ALEX_QUEUE_DIR=/data/alex-dispatch/queue" >> /data/.env
echo "ALEX_LOG_DIR=/data/alex-dispatch/logs"   >> /data/.env
echo "ALEX_DISPATCH_PORT=8080"                 >> /data/.env

# 5. Enable and start
systemctl daemon-reload
systemctl enable alex-dispatch
systemctl start alex-dispatch
systemctl status alex-dispatch

# 6. Smoke test (from the VPS itself)
curl -s http://localhost:8080/health
```

## DNS setup (Netlify DNS)

Add an A record in Netlify DNS for `mgcglobalconsulting.com`:
- **Name:** `agentdispatch`
- **Value:** `<VPS public IP>`  (check with: `curl -s ifconfig.me` on VPS)
- **TTL:** 3600

Hostinger VPS already provides SSL via Let's Encrypt for `*.hostingersite.com`. For the custom subdomain you need a cert on the VPS:

```bash
apt install certbot
certbot certonly --standalone -d agentdispatch.mgcglobalconsulting.com
```

Then proxy port 443 → 8080 with nginx:

```nginx
server {
    listen 443 ssl;
    server_name agentdispatch.mgcglobalconsulting.com;
    ssl_certificate     /etc/letsencrypt/live/agentdispatch.mgcglobalconsulting.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agentdispatch.mgcglobalconsulting.com/privkey.pem;

    location /webhook {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /health {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

## Verification checklist

- [ ] `curl https://agentdispatch.mgcglobalconsulting.com/health` returns `{"ok": true, ...}`
- [ ] Submit a test lead on the MGC website — Netlify log shows `Alex dispatch: forwarded`
- [ ] VPS log (`journalctl -u alex-dispatch -f`) shows the event queued and Hermes invoked
- [ ] Hermes processes the prompt and Alex notifies Mark via Telegram
- [ ] Replay the same event (same event_id) — VPS returns `{"received": true, "duplicate": true}`
- [ ] Send a request without a valid signature — VPS returns 401
- [ ] Stop the server, add an event, restart — pending queue file is reloaded and processed

## Event types currently wired

| Event type                   | Source function       | Alex action                         |
|------------------------------|-----------------------|-------------------------------------|
| `lead.submitted`             | lead-intake.js        | Elena notified; Telegram brief to Mark |
| `lead.qualified`             | (future trigger)      | Elena discovery follow-up draft     |
| `customer.onboarding_confirmed` | (future trigger)   | Jordan welcome draft                |
| `support.ticket_created`     | (future trigger)      | David acknowledgment draft          |
| `invoice.issued`             | (future trigger)      | Julian invoice cover draft          |
| `technical.milestone_changed`| (future trigger)      | Marcus update draft                 |
| `escalation.requested`       | trueassist.js (future)| Urgent Telegram brief to Mark       |
| `owner.update_requested`     | (manual trigger)      | Consolidated owner brief            |
