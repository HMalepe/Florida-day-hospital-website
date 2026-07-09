#!/usr/bin/env bash
set -euo pipefail

PUBLIC_SITE="$(printf '%s' "${PUBLIC_SITE:-}" | tr '[:upper:]' '[:lower:]' | xargs)"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/_site"
VERCEL_STATIC="$ROOT/.vercel/output/static"
VERCEL_CONFIG="$ROOT/.vercel/output/config.json"

write_vercel_config_public() {
  mkdir -p "$(dirname "$VERCEL_CONFIG")"
  cat > "$VERCEL_CONFIG" <<'EOF'
{
  "version": 3,
  "routes": [
    { "handle": "filesystem" }
  ]
}
EOF
}

write_vercel_config_gated() {
  mkdir -p "$(dirname "$VERCEL_CONFIG")"
  cat > "$VERCEL_CONFIG" <<'EOF'
{
  "version": 3,
  "overrides": {
    "index.html": {
      "path": "index.html",
      "headers": {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "cdn-cache-control": "no-store",
        "vercel-cdn-cache-control": "no-store",
        "pragma": "no-cache",
        "expires": "0"
      }
    },
    "404.html": {
      "path": "404.html",
      "headers": {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "cdn-cache-control": "no-store",
        "vercel-cdn-cache-control": "no-store",
        "pragma": "no-cache",
        "expires": "0"
      }
    },
    "css/site.css": {
      "path": "css/site.css",
      "headers": {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "cdn-cache-control": "no-store",
        "vercel-cdn-cache-control": "no-store"
      }
    },
    "favicon.svg": {
      "path": "favicon.svg",
      "headers": {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "cdn-cache-control": "no-store",
        "vercel-cdn-cache-control": "no-store"
      }
    },
    "robots.txt": {
      "path": "robots.txt",
      "headers": {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "cdn-cache-control": "no-store",
        "vercel-cdn-cache-control": "no-store"
      }
    }
  },
  "routes": [
    { "handle": "filesystem" },
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "headers": {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "cdn-cache-control": "no-store",
        "vercel-cdn-cache-control": "no-store",
        "pragma": "no-cache",
        "expires": "0"
      }
    }
  ]
}
EOF
}

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
  mkdir -p "$dest/css"

  cp "$gate" "$dest/index.html"
  cp "$gate" "$dest/404.html"

  for page in "$ROOT"/*.html; do
    base="$(basename "$page")"
    [ "$base" = "coming-soon.html" ] && continue
    cp "$gate" "$dest/$base"
  done

  # Cached asset URLs from the previous public deploy resolve to the gate, not stale files.
  mkdir -p "$dest/js" "$dest/data"
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

rm -rf "$OUT" "$ROOT/.vercel/output"
mkdir -p "$OUT" "$VERCEL_STATIC"

if [ "$PUBLIC_SITE" = "true" ]; then
  echo "PUBLIC_SITE=true — deploying full site"
  deploy_full "$OUT"
  deploy_full "$VERCEL_STATIC"
  write_vercel_config_public
else
  echo "PUBLIC_SITE=${PUBLIC_SITE:-<unset>} — deploying gate page only (no-store, no cache bypass)"
  deploy_gated "$OUT"
  deploy_gated "$VERCEL_STATIC"
  write_vercel_config_gated
fi
