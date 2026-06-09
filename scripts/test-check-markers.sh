#!/usr/bin/env bash
set -euo pipefail
TMPDIR=$(mktemp -d); trap 'rm -rf "$TMPDIR"' EXIT
mkdir -p "$TMPDIR/public"
cat > "$TMPDIR/public/has-markers.html" <<EOF
<html><body><!-- FOOTER --><!-- COOKIE --></body></html>
EOF
cat > "$TMPDIR/public/missing.html" <<EOF
<html><body>nothing</body></html>
EOF
if (cd "$TMPDIR" && bash "$OLDPWD/scripts/check-markers-present.sh"); then
  echo "FAIL: should have flagged missing.html"; exit 1
else
  echo "PASS"
fi
