#!/usr/bin/env bash
# Forbids pricing strings in any rendered HTML file.
# Run by `npm run check:forbidden` and CI.
set -euo pipefail

FORBIDDEN=(
  '\$79\b'          # original pre-order reservation price — never coming back
  'Reserve Yours'   # pre-order CTA — pricing strategy shifted to subscription
)
# Note: legitimate subscription pricing (e.g. $4.99/month, €4,99/Monat) is now
# allowed. If a pricing-removal phase comes back, restore the patterns here.

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
