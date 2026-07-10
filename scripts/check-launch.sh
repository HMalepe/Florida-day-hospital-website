#!/usr/bin/env bash
# Pre-launch readiness check — run from repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0
warn_count=0

ok()   { printf '  ✓ %s\n' "$1"; }
warn() { printf '  ! %s\n' "$1"; warn_count=$((warn_count + 1)); }
bad()  { printf '  ✗ %s\n' "$1"; fail=$((fail + 1)); }

json_get() {
  local file="$1" path="$2"
  if command -v jq >/dev/null 2>&1; then
    jq -r "$path" "$file"
    return
  fi
  if command -v node >/dev/null 2>&1; then
    node -e "
      const d = require('./' + process.argv[1]);
      const keys = process.argv[2].split('.');
      let v = d;
      for (const k of keys) v = v?.[k];
      if (v === undefined || v === null) process.exit(0);
      process.stdout.write(String(v));
    " "$file" "${path#.}"
    return
  fi
  echo ""
}

echo "Florida Day Hospital — launch check"
echo

echo "Contact (data/contact.json)"
if command -v jq >/dev/null 2>&1 || command -v node >/dev/null 2>&1; then
  phone_pending="$(json_get data/contact.json .phone.pending)"
  email_pending="$(json_get data/contact.json .email.pending)"
  phone_tel="$(json_get data/contact.json .phone.tel)"
  email_addr="$(json_get data/contact.json .email.address)"

  if [ "$phone_pending" = "true" ] || [ -z "$phone_tel" ]; then
    warn "Phone not confirmed — site shows “Enquire when booking”"
  else
    ok "Phone configured ($phone_tel)"
  fi

  if [ "$email_pending" = "true" ] || [ -z "$email_addr" ]; then
    warn "Email not confirmed — site shows “Enquire when booking”"
  else
    ok "Email configured ($email_addr)"
  fi
else
  warn "jq/node not available — skipping contact.json parse"
fi

echo
echo "Photography (data/photography.json)"
if command -v jq >/dev/null 2>&1 || command -v node >/dev/null 2>&1; then
  while IFS= read -r slot; do
    enabled="$(json_get data/photography.json ".slots.${slot}.enabled")"
    if [ "$enabled" = "true" ]; then
      fallback="$(json_get data/photography.json ".slots.${slot}.fallback")"
      if [ -f "$fallback" ]; then
        ok "$slot enabled — $fallback exists"
      else
        bad "$slot enabled but missing file: $fallback"
      fi
    else
      warn "$slot disabled (awaiting facility photos)"
    fi
  done <<'SLOTS'
hero
pathwayAccent
providers
booking
SLOTS
else
  warn "jq/node not available — skipping photography.json parse"
fi

echo
echo "Build"
if bash scripts/prepare-site.sh >/dev/null; then
  ok "prepare-site.sh succeeded → _site/"
else
  bad "prepare-site.sh failed"
fi

echo
echo "Summary"
if [ "$fail" -gt 0 ]; then
  echo "  $fail blocking issue(s), $warn_count warning(s)"
  exit 1
fi
if [ "$warn_count" -gt 0 ]; then
  echo "  Ready to deploy with $warn_count warning(s) — see docs/LAUNCH-CHECKLIST.md"
  exit 0
fi
echo "  All checks passed"
exit 0
