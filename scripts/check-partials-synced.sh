#!/usr/bin/env bash
# partials/ is the source; public/_partials/ is what actually ships.
#
# functions/_partials.js fetches /_partials/<name>.html through the Pages
# ASSETS binding, and wrangler.toml deploys public/ with no build command, so
# the committed public/_partials/ copy is the deployed artifact. Editing
# partials/ alone changes nothing in production — CI passes, the deploy
# succeeds, and the site quietly keeps serving the old content.
#
# That is exactly how the German buy button kept pointing at an empty Amazon
# search after it had supposedly been switched to Stripe (fixed in ed4e1a3).
#
# Fix when this fails: npm run build && git add public/_partials
set -euo pipefail

if [ ! -d partials ]; then
  echo "OK: no partials/ directory — nothing to sync"
  exit 0
fi

fail=0
for src in partials/*.html; do
  [ -e "$src" ] || continue
  built="public/_partials/$(basename "$src")"
  if [ ! -f "$built" ]; then
    echo "ERROR: $src has never been built into public/_partials/"
    fail=1
  elif ! diff -q "$src" "$built" >/dev/null; then
    echo "ERROR: $src differs from the deployed copy $built"
    diff -u "$built" "$src" | sed 's/^/    /'
    fail=1
  fi
done

# A stale built copy whose source is gone still ships. Catch that too.
for built in public/_partials/*.html; do
  [ -e "$built" ] || continue
  src="partials/$(basename "$built")"
  if [ ! -f "$src" ]; then
    echo "ERROR: $built has no source in partials/ — delete it or restore the source"
    fail=1
  fi
done

if [ $fail -ne 0 ]; then
  echo
  echo "  public/_partials/ is what Cloudflare actually serves."
  echo "  Run: npm run build && git add public/_partials"
fi
[ $fail -eq 0 ] && echo "OK: partials/ and public/_partials/ are in sync"
exit $fail
