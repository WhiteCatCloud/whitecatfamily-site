#!/usr/bin/env bash
# Forbids pricing strings in any rendered HTML file.
# Run by `npm run check:forbidden` and CI.
set -euo pipefail

FORBIDDEN=(
  '\$79\b'
  '\$1\.99'
  '\$5\.99'
  '\$8\.99'
  '\$[0-9]+\.[0-9]+/(mo|month)\b'
  '\b[0-9]+\.[0-9]+ ?/ ?(mo|month)\b'
  'Reserve Yours'
)
# Note: anchored to actual price contexts so 'monitoring', 'mode', 'mom', etc. don't false-positive.

PATHS=()
[ -d public ] && PATHS+=(public/)
[ -d partials ] && PATHS+=(partials/)

if [ ${#PATHS[@]} -eq 0 ]; then
  echo "OK: no public/ or partials/ directory to scan"
  exit 0
fi

fail=0
for pattern in "${FORBIDDEN[@]}"; do
  if grep -rIE "$pattern" "${PATHS[@]}" 2>/dev/null; then
    echo "ERROR: forbidden string '$pattern' found above"
    fail=1
  fi
done

if [ $fail -ne 0 ]; then
  echo
  echo "Pricing/Reserve language must be removed. See EU_LAUNCH_WEBSITE_SPEC.md §5."
  exit 1
fi
echo "OK: no forbidden strings in public/ or partials/"
