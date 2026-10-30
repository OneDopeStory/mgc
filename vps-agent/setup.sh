#!/usr/bin/env bash
# ============================================================
# Grok Voice Bridge — one-shot VPS setup script
# MGC Global Consulting
#
# Run as root on the Hostinger VPS (same box as Alex Dispatch,
# different port — this does NOT touch alex-dispatch's service).
# Paste the entire script into the SSH terminal, or:
#   bash <(cat setup.sh)
#
# Before running:
#   1. Have a REAL xAI API key from https://console.x.ai (the one
#      previously tried under Netlify's GROK_API_KEY failed auth —
#      "Incorrect API key provided" — get/confirm a fresh one there).
#   2. Have a shared secret ready (run on your Mac):
#        openssl rand -hex 32    <- VPS_BRIDGE_SHARED_SECRET
#      This same value must also be set on Netlify for
#      grok-voice-webhook.js and grok-voice-tools.js.
#   3. Edit the REQUIRED variables below.
#   4. If exposing this over HTTPS (needed for xAI's webhook to reach
#      it directly), a DNS A record for voice.mgcglobalconsulting.com
#      must already point at this server's IP — DNS is managed in
#      Squarespace, not Netlify (see root CLAUDE.md). If that record
#      isn't live yet, this script still installs/starts the service;
#      it just skips the nginx+certbot steps and tells you so.
# ============================================================

set -euo pipefail

# ── REQUIRED: fill these in before running ────────────────────────────────────
XAI_API_KEY=""                 # from https://console.x.ai — must be a real xAI key
VPS_BRIDGE_SHARED_SECRET=""    # output of: openssl rand -hex 32
MGC_SITE_URL="https://www.mgcglobalconsulting.com"
DOMAIN="voice.mgcglobalconsulting.com"   # leave as-is unless the owner picks a different subdomain
EMAIL="mark@mgcglobalconsulting.com"
BRIDGE_PORT="8787"              # must stay different from Alex Dispatch's 8080
# ─────────────────────────────────────────────────────────────────────────────

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$XAI_API_KEY" || -z "$VPS_BRIDGE_SHARED_SECRET" ]]; then
  echo "ERROR: Set XAI_API_KEY and VPS_BRIDGE_SHARED_SECRET at the top of this script before running."
  exit 1
fi

if [[ "$EUID" -ne 0 ]]; then
  echo "ERROR: Run this script as root (sudo bash setup.sh)"
  exit 1
fi

echo ""
echo "========================================================"
echo "  Grok Voice Bridge VPS Setup"
echo "========================================================"
echo ""

# ── Step 1: Directories ───────────────────────────────────────────────────────
echo "[1/7] Creating directories..."
mkdir -p /opt/grok-voice-bridge
mkdir -p /data/grok-voice-bridge

# ── Step 2: Copy bridge code ─────────────────────────────────────────────────
echo "[2/7] Copying grok-voice-bridge.js + package files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for f in grok-voice-bridge.js package.json package-lock.json; do
  if [[ -f "$SCRIPT_DIR/$f" ]]; then
    cp "$SCRIPT_DIR/$f" /opt/grok-voice-bridge/
  else
    echo "      $f not found next to setup.sh."
    echo "      Upload the whole vps-agent/ directory first, e.g.:"
    echo "        scp -r vps-agent root@<VPS-IP>:/root/vps-agent-upload"
    exit 1
  fi
done

# ── Step 3: Install Node deps ─────────────────────────────────────────────────
echo "[3/7] Installing Node dependencies..."
if ! command -v node &>/dev/null; then
  echo "      node not found — installing Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
cd /opt/grok-voice-bridge && npm install --omit=dev --silent

# ── Step 4: Write env file ────────────────────────────────────────────────────
echo "[4/7] Writing environment config to /data/grok-voice-bridge/.env..."

set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" /data/grok-voice-bridge/.env 2>/dev/null; then
    echo "      $key already set — skipping"
  else
    echo "${key}=${val}" >> /data/grok-voice-bridge/.env
    echo "      Set $key"
  fi
}

touch /data/grok-voice-bridge/.env
set_env "XAI_API_KEY"               "$XAI_API_KEY"
set_env "VPS_BRIDGE_SHARED_SECRET"  "$VPS_BRIDGE_SHARED_SECRET"
set_env "MGC_SITE_URL"              "$MGC_SITE_URL"
set_env "PORT"                      "$BRIDGE_PORT"

# ── Step 5: Systemd service ───────────────────────────────────────────────────
echo "[5/7] Installing systemd service..."
if [[ -f "$SCRIPT_DIR/grok-voice-bridge.service" ]]; then
  cp "$SCRIPT_DIR/grok-voice-bridge.service" /etc/systemd/system/
else
  echo "      grok-voice-bridge.service not found next to setup.sh — aborting."
  exit 1
fi

systemctl daemon-reload
systemctl enable grok-voice-bridge
systemctl restart grok-voice-bridge
echo "      grok-voice-bridge service started on port $BRIDGE_PORT"

# ── Step 6: nginx + TLS (only if DNS already resolves to this host) ──────────
echo "[6/7] Checking DNS for $DOMAIN..."
THIS_IP="$(curl -s https://api.ipify.org || true)"
RESOLVED_IP="$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' || true)"

if [[ -n "$RESOLVED_IP" && "$RESOLVED_IP" == "$THIS_IP" ]]; then
  echo "      $DOMAIN resolves to this server ($THIS_IP) — setting up nginx + TLS."
  if ! command -v nginx &>/dev/null; then
    apt-get update -qq && apt-get install -y -qq nginx
  fi

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

    location /incoming-call {
        proxy_pass         http://127.0.0.1:$BRIDGE_PORT;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   Host \$host;
        proxy_read_timeout 15s;
        proxy_send_timeout 10s;
        client_max_body_size 64k;
    }

    location / {
        return 404;
    }
}
NGINX

  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/

  if ! command -v certbot &>/dev/null; then
    apt-get install -y -qq certbot python3-certbot-nginx
  fi

  certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --redirect --non-interactive
  nginx -t && systemctl reload nginx
  echo "      HTTPS live at https://$DOMAIN/incoming-call"
else
  echo "      $DOMAIN does not yet resolve to this server (this_ip=$THIS_IP resolved=$RESOLVED_IP)."
  echo "      Skipping nginx/TLS — the bridge is still running locally on port $BRIDGE_PORT."
  echo "      Add the DNS A record in Squarespace, then re-run this script to finish HTTPS setup."
fi

# ── Step 7: Smoke test ─────────────────────────────────────────────────────────
echo "[7/7] Local health check..."
sleep 2
journalctl -u grok-voice-bridge -n 20 --no-pager || true

echo ""
echo "========================================================"
echo "  Setup complete."
echo ""
echo "  Next steps:"
echo "  1. Set on Netlify: VPS_BRIDGE_SHARED_SECRET=<same value used above>"
echo "  2. Set on Netlify: VPS_BRIDGE_URL=https://$DOMAIN/incoming-call (once DNS/TLS is live)"
echo "  3. Set on Netlify: XAI_WEBHOOK_SECRET=<from xAI dashboard webhook config>"
echo "  4. In the xAI dashboard, register the realtime.call.incoming webhook to:"
echo "     https://www.mgcglobalconsulting.com/.netlify/functions/grok-voice-webhook"
echo "  5. Confirm a phone_number_id is actually provisioned for 410-339-8375 in xAI"
echo "  6. Trigger a Netlify redeploy to pick up the new env vars"
echo "  7. Watch: journalctl -u grok-voice-bridge -f"
echo "========================================================"
