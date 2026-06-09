#!/usr/bin/env bash
# Every page HTML file must carry the markers required for the current phase
# so the Pages Function can inject the right partial.
#
# Phase progression — env var MARKER_PHASE controls which markers are required:
#   MARKER_PHASE=2  → FOOTER only          (Phase 2 ships footer markers)
#   MARKER_PHASE=6  → FOOTER + COOKIE      (Phase 6 ships cookie markers)
#   MARKER_PHASE=8  → FOOTER + COOKIE + LOCALE-SWITCH + HREFLANG (Phase 8)
# Default: highest phase. CI passes MARKER_PHASE per branch state.
set -euo pipefail

PHASE=${MARKER_PHASE:-8}

declare -a REQUIRED_MARKERS
REQUIRED_MARKERS=('<!-- FOOTER -->')
if [ "$PHASE" -ge 6 ]; then REQUIRED_MARKERS+=('<!-- COOKIE -->'); fi
if [ "$PHASE" -ge 8 ]; then
  REQUIRED_MARKERS+=('<!-- LOCALE-SWITCH -->' '<!-- HREFLANG -->')
fi

fail=0
# All page HTML files (skip _partials/ build output — those are partial bodies,
# not pages, so they don't carry markers themselves).
for f in $(find public -name '*.html' -type f -not -path 'public/_partials/*' 2>/dev/null); do
  for marker in "${REQUIRED_MARKERS[@]}"; do
    if ! grep -qF "$marker" "$f"; then
      echo "ERROR: $f missing marker: $marker"
      fail=1
    fi
  done
done

if [ $fail -ne 0 ]; then
  echo
  echo "Every public/**/*.html must contain markers required for MARKER_PHASE=$PHASE."
  echo "See EU_LAUNCH_WEBSITE_SPEC.md → Architecture → Partial library."
  exit 1
fi
echo "OK: all public/**/*.html have markers for phase $PHASE"
