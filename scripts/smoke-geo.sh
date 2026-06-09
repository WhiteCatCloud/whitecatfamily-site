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
  # -L follows 302 redirects (German visitor at / → /de/)
  body=$(curl -sSL $h_country $h_cookie "$BASE/$Q")
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

# Phase 4: /de/ routing assertions
status=$(curl -sS -o /dev/null -w '%{http_code}' -H "CF-IPCountry: DE" "$BASE/$Q")
[ "$status" = "302" ] || { echo "FAIL DE@/ expected 302, got $status"; exit 1; }
echo "PASS  DE visitor at /  →  302"

loc=$(curl -sS -I -H "CF-IPCountry: DE" "$BASE/$Q" | grep -i ^location: | awk '{print $2}' | tr -d '\r')
# Allow optional preserved query string (e.g. /de/?eu=1)
case "$loc" in
  /de/|/de/\?*) echo "PASS  DE visitor at /  →  Location: $loc" ;;
  *) echo "FAIL DE@/ Location: expected /de/ (with optional ?query), got '$loc'"; exit 1 ;;
esac

# Cookie en-US + IP DE → stays on /
status=$(curl -sS -o /dev/null -w '%{http_code}' -H "CF-IPCountry: DE" -H "Cookie: wc_locale=en-US" "$BASE/$Q")
[ "$status" = "200" ] || { echo "FAIL cookie en-US@DE expected 200, got $status"; exit 1; }
echo "PASS  Cookie wc_locale=en-US wins over CF-IPCountry: DE"

# Anti-loop: visitor on /de/ with cookie en-US → NOT redirected (served as-is)
status=$(curl -sS -o /dev/null -w '%{http_code}' -H "CF-IPCountry: US" -H "Cookie: wc_locale=en-US" "$BASE/de/$Q")
[ "$status" = "200" ] || { echo "FAIL /de/ with en-US cookie expected 200, got $status"; exit 1; }
echo "PASS  Manual /de/ access not redirected away even with en-US cookie"

# Phase 2: footer injection
check_footer() {
  local label="$1" country="$2" expected_marker="$3"
  # -L follows the / → /de/ redirect for German visitors
  body=$(curl -sSL -H "CF-IPCountry: $country" "$BASE/$Q")
  if echo "$body" | grep -qF "$expected_marker"; then
    echo "PASS  $label footer present"
  else
    echo "FAIL  $label footer missing ($expected_marker)"
    exit 1
  fi
}

check_footer "US"    US  "White Cat Cloud Inc."
check_footer "EU-EN" FR  "Cluster s.r.o."
check_footer "EU-EN" FR  "Sold in the European Union"
check_footer "EU-DE" DE  "Verkauft in der Europäischen Union"
check_footer "EU-DE" DE  "USt-IdNr.: SK2023158368"

# Marker leak check
if curl -sS -H 'CF-IPCountry: US' "$BASE/$Q" | grep -qF '<!-- FOOTER -->'; then
  echo "FAIL  raw FOOTER marker leaked to response"; exit 1
fi
echo "PASS  no FOOTER marker leak"

echo
echo "All geo + footer smoke tests passed."
