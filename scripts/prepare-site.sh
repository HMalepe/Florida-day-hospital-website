#!/usr/bin/env bash
set -euo pipefail

PUBLIC_SITE="$(printf '%s' "${PUBLIC_SITE:-}" | tr '[:upper:]' '[:lower:]' | xargs)"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/_site"

rm -rf "$OUT"
mkdir -p "$OUT/css"

if [ "$PUBLIC_SITE" = "true" ]; then
  echo "PUBLIC_SITE=true — deploying full site"
  rsync -a \
    --exclude='.git' \
    --exclude='_site' \
    --exclude='coming-soon.html' \
    --exclude='robots-private.txt' \
    --exclude='.github' \
    --exclude='scripts' \
    --exclude='vercel.json' \
    "$ROOT/" "$OUT/"
else
  echo "PUBLIC_SITE=${PUBLIC_SITE:-<unset>} — deploying gate page only"
  GATE="$ROOT/coming-soon.html"

  cp "$GATE" "$OUT/index.html"
  cp "$GATE" "$OUT/404.html"

  for page in "$ROOT"/*.html; do
    base="$(basename "$page")"
    [ "$base" = "coming-soon.html" ] && continue
    cp "$GATE" "$OUT/$base"
  done

  cp "$ROOT/css/site.css" "$OUT/css/"
  cp "$ROOT/favicon.svg" "$OUT/" 2>/dev/null || true
  cp "$ROOT/robots-private.txt" "$OUT/robots.txt"
fi
