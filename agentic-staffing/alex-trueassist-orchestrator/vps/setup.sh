#!/usr/bin/env bash
# ============================================================
# Alex Dispatch — one-shot VPS setup script
# MGC Global Consulting
#
# Run as root on the Hostinger VPS after SSH-ing in.
# Paste the entire script into the SSH terminal, or:
#   bash <(cat setup.sh)
#
# Before running:
#   1. Have your two secrets ready (run on your Mac):
#        openssl rand -hex 32    <- ALEX_DISPATCH_SECRET
#        openssl rand -hex 32    <- ALEX_DISPATCH_INTERNAL_SECRET (different run)
#   2. Edit the four REQUIRED variables below.
#   3. DNS A record for agentdispatch.mgcglobalconsulting.com must already
#      point to this server's IP — certbot needs it to get a TLS cert.
# ============================================================

set -euo pipefail

# ── REQUIRED: fill these in before running ────────────────────────────────────
DISPATCH_SECRET=""            # output of: openssl rand -hex 32  (first run)
HERMES_BIN="hermes"           # path to hermes binary; usually just "hermes"
DOMAIN="agentdispatch.mgcglobalconsulting.com"
EMAIL="mark@mgcglobalconsulting.com"   # used for Let's Encrypt expiry notices
# ─────────────────────────────────────────────────────────────────────────────

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$DISPATCH_SECRET" ]]; then
  echo "ERROR: Set DISPATCH_SECRET at the top of this script before running."
  echo "       Run:  openssl rand -hex 32"
  exit 1
fi

if [[ "$EUID" -ne 0 ]]; then
  echo "ERROR: Run this script as root (sudo bash setup.sh)"
  exit 1
fi

echo ""
echo "========================================================"
echo "  Alex Dispatch VPS Setup — $DOMAIN"
echo "========================================================"
echo ""

# ── Step 1: Directories ───────────────────────────────────────────────────────
echo "[1/8] Creating directories..."
mkdir -p /opt/hermes-agent/dispatch
mkdir -p /data/alex-dispatch/queue
mkdir -p /data/alex-dispatch/logs

# ── Step 2: Copy dispatch server ─────────────────────────────────────────────
echo "[2/8] Copying webhook_server.py..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/webhook_server.py" ]]; then
  cp "$SCRIPT_DIR/webhook_server.py" /opt/hermes-agent/dispatch/
  echo "      Copied from $SCRIPT_DIR"
else
  echo "      webhook_server.py not found next to setup.sh."
  echo "      Upload it first: scp webhook_server.py root@<VPS-IP>:/opt/hermes-agent/dispatch/"
  exit 1
fi

# ── Step 3: Write /data/.env ──────────────────────────────────────────────────
echo "[3/8] Writing environment config to /data/.env..."

# Append only if key not already present (idempotent re-runs)
set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" /data/.env 2>/dev/null; then
    echo "      $key already set — skipping"
  else
    echo "${key}=${val}" >> /data/.env
    echo "      Set $key"
  fi
}

touch /data/.env
set_env "ALEX_DISPATCH_SECRET"  "$DISPATCH_SECRET"
set_env "HERMES_BIN"             "$HERMES_BIN"
set_env "ALEX_QUEUE_DIR"         "/data/alex-dispatch/queue"
set_env "ALEX_LOG_DIR"           "/data/alex-dispatch/logs"
set_env "ALEX_DISPATCH_PORT"     "8080"

# ── Step 4: Systemd service ───────────────────────────────────────────────────
echo "[4/8] Installing systemd service..."

if [[ -f "$SCRIPT_DIR/alex-dispatch.service" ]]; then
  cp "$SCRIPT_DIR/alex-dispatch.service" /etc/systemd/system/
else
  # Write it inline if not next to setup.sh
  cat > /etc/systemd/system/alex-dispatch.service <<'UNIT'
[Unit]
Description=Alex Dispatch Webhook Server (MGC Global Consulting)
After=network.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/hermes-agent/dispatch
EnvironmentFile=/data/.env
ExecStart=/usr/bin/python3 /opt/hermes-agent/dispatch/webhook_server.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=alex-dispatch
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
UNIT
fi

systemctl daemon-reload
systemctl enable alex-dispatch
systemctl start alex-dispatch
echo "      alex-dispatch service started"

# ── Step 5: nginx ─────────────────────────────────────────────────────────────
echo "[5/8] Installing nginx..."
if ! command -v nginx &>/dev/null; then
  apt-get update -qq && apt-get install -y -qq nginx
fi

# ── Step 6: nginx config ──────────────────────────────────────────────────────
echo "[6/8] Writing nginx site config..."
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

cat > "$NGINX_CONF" <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location /webhook {
        proxy_pass         http://127.0.0.1:8080;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   Host \$host;
        proxy_read_timeout 15s;
        proxy_send_timeout 10s;
        client_max_body_size 64k;
    }

    location /health {
        proxy_pass         http://127.0.0.1:8080;
        proxy_read_timeout 5s;
    }

    location / {
        return 404;
    }
}
NGINX

# Enable the site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/

# Disable the default site if it's still there
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
  echo "      Removed default nginx site"
fi

# ── Step 7: TLS cert (certbot) ────────────────────────────────────────────────
echo "[7/8] Installing TLS certificate via certbot..."
if ! command -v certbot &>/dev/null; then
  apt-get install -y -qq certbot python3-certbot-nginx
fi

# Get cert and auto-patch the nginx config
# --non-interactive requires DNS to already resolve to this IP
certbot --nginx \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --redirect \
  --non-interactive

# ── Step 8: Final reload and smoke test ───────────────────────────────────────
echo "[8/8] Reloading nginx and running health check..."
nginx -t && systemctl reload nginx

sleep 2

echo ""
echo "── Local health check ───────────────────────────────────"
curl -sf http://localhost:8080/health && echo ""

echo ""
echo "── HTTPS health check ───────────────────────────────────"
curl -sf "https://$DOMAIN/health" && echo ""

echo ""
echo "========================================================"
echo "  Setup complete."
echo ""
echo "  Next steps:"
echo "  1. Copy ALEX_DISPATCH_SECRET from /data/.env"
echo "  2. Set it on Netlify: ALEX_DISPATCH_SECRET=<value>"
echo "  3. Set ALEX_DISPATCH_URL=https://$DOMAIN/webhook on Netlify"
echo "  4. Set ALEX_DISPATCH_INTERNAL_SECRET on Netlify (new openssl rand -hex 32)"
echo "  5. Set API key in Hermes: hermes config set openrouter.api_key <key>"
echo "  6. Trigger a Netlify redeploy to pick up the new env vars"
echo "  7. Submit a test lead on mgcglobalconsulting.com"
echo "  8. Watch: journalctl -u alex-dispatch -f"
echo "========================================================"
