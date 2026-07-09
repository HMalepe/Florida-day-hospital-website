#!/usr/bin/env bash
set -euo pipefail

PUBLIC_SITE="$(printf '%s' "${PUBLIC_SITE:-}" | tr '[:upper:]' '[:lower:]' | xargs)"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/_site"

deploy_full() {
  local dest="$1"
  mkdir -p "$dest"
  rsync -a \
    --exclude='.git' \
    --exclude='_site' \
    --exclude='.vercel' \
    --exclude='coming-soon.html' \
    --exclude='robots-private.txt' \
    --exclude='.github' \
    --exclude='scripts' \
    --exclude='vercel.json' \
    "$ROOT/" "$dest/"
}

deploy_gated() {
  local dest="$1"
  local gate="$ROOT/coming-soon.html"

  rm -rf "$dest"
  mkdir -p "$dest/css" "$dest/js" "$dest/data"

  cp "$gate" "$dest/index.html"
  cp "$gate" "$dest/404.html"

  for page in "$ROOT"/*.html; do
    base="$(basename "$page")"
    [ "$base" = "coming-soon.html" ] && continue
    cp "$gate" "$dest/$base"
  done

  # Former public URLs that may still be cached resolve to the gate, not stale assets.
  for stale in \
    "$dest/js/site.js" \
    "$dest/js/contact.js" \
    "$dest/js/mobile-ui.js" \
    "$dest/js/schema.js" \
    "$dest/js/providers.js" \
    "$dest/js/trust.js" \
    "$dest/js/book-form.js" \
    "$dest/js/photography.js" \
    "$dest/data/contact.json" \
    "$dest/data/providers.json" \
    "$dest/data/trust.json" \
    "$dest/data/photography.json" \
    "$dest/site.webmanifest" \
    "$dest/sitemap.xml"
  do
    cp "$gate" "$stale"
  done

  cp "$ROOT/css/site.css" "$dest/css/"
  cp "$ROOT/favicon.svg" "$dest/" 2>/dev/null || true
  cp "$ROOT/robots-private.txt" "$dest/robots.txt"
}

rm -rf "$OUT"
mkdir -p "$OUT"

if [ "$PUBLIC_SITE" = "true" ]; then
  if grep -q '"destination": "/index.html"' "$ROOT/vercel.json" 2>/dev/null; then
    echo "ERROR: PUBLIC_SITE=true but vercel.json still has gate rewrites."
    echo "Copy vercel.public.json to vercel.json, commit, and redeploy."
    exit 1
  fi
  echo "PUBLIC_SITE=true — deploying full site"
  deploy_full "$OUT"
else
  echo "PUBLIC_SITE=${PUBLIC_SITE:-<unset>} — deploying gate page only (no-store, cache bypass)"
  deploy_gated "$OUT"
fi
