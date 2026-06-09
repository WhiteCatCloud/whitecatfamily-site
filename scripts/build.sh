#!/usr/bin/env bash
# Stub build script — full implementation lands in Task 2.5 of the EU launch plan.
# When partials/ exists, copies it into public/_partials/ for the Pages Function to fetch.
# Until then, this is a no-op so `npm run dev` doesn't break in Phase 0/1.
set -euo pipefail

if [ -d partials ]; then
  mkdir -p public/_partials
  cp -r partials/* public/_partials/ 2>/dev/null || true
  # Prevent /_partials/* indexing
  cat > public/_partials/robots.txt <<'EOF'
User-agent: *
Disallow: /
EOF
  echo "Build: partials copied to public/_partials/"
else
  echo "Build: no partials/ directory yet (Phase 2 not started) — skipping"
fi
