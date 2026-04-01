#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# MGC Consulting OS — Staging Sync Script
# Usage: ./sync-staging.sh [--dry-run] [--full]
#
# Syncs local mgc-site-complete_1 to your staging environment.
# Supports: Netlify CLI, Cloudflare Pages, or plain rsync (SSH)
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config — edit these ───────────────────────────────────────────────
SITE_DIR="$(cd "$(dirname "$0")" && pwd)"
STAGING_METHOD="${STAGING_METHOD:-netlify}"   # netlify | cloudflare | rsync

# rsync target (only used if STAGING_METHOD=rsync)
RSYNC_HOST="${RSYNC_HOST:-user@your-server.com}"
RSYNC_PATH="${RSYNC_PATH:-/var/www/mgc-staging}"

# Netlify site ID (only used if STAGING_METHOD=netlify)
NETLIFY_SITE_ID="${NETLIFY_SITE_ID:-YOUR_SITE_ID}"

# Cloudflare project name (only used if STAGING_METHOD=cloudflare)
CF_PROJECT="${CF_PROJECT:-mgc-global-consulting}"

# ── Flags ─────────────────────────────────────────────────────────────
DRY_RUN=false
FULL_DEPLOY=false

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --full)    FULL_DEPLOY=true ;;
  esac
done

# ── Exclude list — never sync these ──────────────────────────────────
EXCLUDES=(
  ".DS_Store"
  ".mcp.json.txt"
  "*.sh"
  "integrations/"
  "*.md"
  ".git/"
  "node_modules/"
)

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   MGC Consulting OS — Staging Sync       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Source:  $SITE_DIR"
echo "  Method:  $STAGING_METHOD"
echo "  Dry run: $DRY_RUN"
echo ""

# ── Pre-flight: inject JSON-LD into all HTML pages ───────────────────
echo "→ Injecting JSON-LD schema into HTML pages..."
SCHEMA_INLINE=$(cat "$SITE_DIR/schema.jsonld" | tr -d '\n')

for html_file in "$SITE_DIR"/*.html; do
  fname=$(basename "$html_file")
  # Skip error pages
  [[ "$fname" =~ ^(403|404|500)\.html$ ]] && continue

  # Remove existing inline ld+json block if present, then re-inject
  if grep -q 'application/ld+json' "$html_file"; then
    echo "  ↻ $fname — schema already present, skipping"
    continue
  fi

  # Inject before </head>
  LD_TAG="<script type=\"application/ld+json\">${SCHEMA_INLINE}</script>"
  sed -i '' "s|</head>|${LD_TAG}\n</head>|" "$html_file"
  echo "  ✓ $fname — schema injected"
done

# ── Build exclude flags ───────────────────────────────────────────────
RSYNC_EXCLUDES=""
for excl in "${EXCLUDES[@]}"; do
  RSYNC_EXCLUDES="$RSYNC_EXCLUDES --exclude=$excl"
done

# ── Deploy ────────────────────────────────────────────────────────────
case "$STAGING_METHOD" in

  netlify)
    echo "→ Deploying to Netlify staging..."
    CMD="netlify deploy --dir=\"$SITE_DIR\" --site=\"$NETLIFY_SITE_ID\""
    $FULL_DEPLOY && CMD="$CMD --prod"
    $DRY_RUN && echo "  [DRY RUN] $CMD" && exit 0
    eval "$CMD"
    ;;

  cloudflare)
    echo "→ Deploying to Cloudflare Pages..."
    CMD="npx wrangler pages deploy \"$SITE_DIR\" --project-name=\"$CF_PROJECT\""
    $DRY_RUN && echo "  [DRY RUN] $CMD" && exit 0
    eval "$CMD"
    ;;

  rsync)
    echo "→ Syncing via rsync to $RSYNC_HOST:$RSYNC_PATH..."
    CMD="rsync -avz --delete $RSYNC_EXCLUDES \"$SITE_DIR/\" \"$RSYNC_HOST:$RSYNC_PATH/\""
    $DRY_RUN && echo "  [DRY RUN] $CMD" && exit 0
    eval "$CMD"
    ;;

  *)
    echo "ERROR: Unknown STAGING_METHOD '$STAGING_METHOD'. Set to: netlify | cloudflare | rsync"
    exit 1
    ;;

esac

echo ""
echo "✅ Sync complete — $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
