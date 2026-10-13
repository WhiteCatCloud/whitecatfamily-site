#!/usr/bin/env bash
# Box-printed URLs must always resolve to a served HTML file.
# Renaming these files = recall risk. Fail the build hard.
set -euo pipefail

PERMANENT_FILES=(
  'public/doc.html'
  'public/guide.html'
  'public/de/doc.html'
  'public/de/guide.html'
  # Localized /guide pages: a buyer scanning the box is routed to these by
  # locale, so they are as permanent as the root one.
  'public/fr/guide.html'
  'public/sk/guide.html'
  'public/pl/guide.html'
)

fail=0
for f in "${PERMANENT_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: permanent URL file missing: $f"
    echo "  This file's URL is printed on the product box."
    echo "  Restoring it from history is mandatory. See whitecatfamily-site/CLAUDE.md."
    fail=1
  fi
done
[ $fail -eq 0 ] && echo "OK: all permanent-URL files present"
exit $fail
