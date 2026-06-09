#!/usr/bin/env bash
# Smoke-tests the Pages Function locally via `wrangler pages dev`.
# Assumes `EU_LAUNCH_ENABLED=true npm run dev` (or equivalent) is running
# on http://localhost:8788.
#
# Override base URL via BASE env var, e.g.:
#   BASE=https://<preview>.pages.dev npm run smoke:geo
set -euo pipefail

BASE=${BASE:-http://localhost:8788}

# Append ?eu=1 to every URL when running without EU_LAUNCH_ENABLED set,
# so the Function activates even if the local dev session forgot the env var.
# (Harmless when the env var IS set — the gate accepts either.)
Q='?eu=1'

check() {
  local label="$1" country="$2" cookie="$3" expected_locale="$4"
  local h_country="-H CF-IPCountry:$country"
  local h_cookie=""
  if [ -n "$cookie" ]; then h_cookie="-H Cookie:wc_locale=$cookie"; fi
  local body
  body=$(curl -sS $h_country $h_cookie "$BASE/$Q")
  if echo "$body" | grep -qE "<html[^>]*data-locale=\"$expected_locale\""; then
    echo "PASS  $label  → data-locale=$expected_locale"
  else
    echo "FAIL  $label  → expected data-locale=$expected_locale"
    echo "$body" | head -2
    exit 1
  fi
}

check "US visitor, no cookie"           US ""      en-US
check "German visitor, no cookie"       DE ""      de
check "Austrian visitor, no cookie"     AT ""      de
check "French visitor, no cookie"       FR ""      en-EU
check "UK visitor, no cookie"           GB ""      en-EU
check "Cookie overrides geo (DE+en-US)" DE en-US   en-US
check "Cookie overrides geo (US+de)"    US de      de
check "Unknown country → US/ROW"        XX ""      en-US

# Phase 1 assertion: NO redirects yet. /de/ doesn't exist; / always serves index.
status=$(curl -sS -o /dev/null -w '%{http_code}' -H 'CF-IPCountry: DE' "$BASE/$Q")
if [ "$status" != "200" ]; then
  echo "FAIL  DE visitor at /  →  expected 200 (Phase 1 has no redirects yet), got $status"
  exit 1
fi
echo "PASS  DE visitor at /  →  200 (no redirect in Phase 1)"

echo
echo "All geo classifier smoke tests passed."
