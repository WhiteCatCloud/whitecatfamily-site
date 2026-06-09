#!/usr/bin/env bash
set -euo pipefail
TMPDIR=$(mktemp -d); trap "rm -rf $TMPDIR" EXIT
mkdir -p "$TMPDIR/public"
echo "Price: \$79 today" > "$TMPDIR/public/bad.html"
echo "Plan: Family" > "$TMPDIR/public/good.html"
if (cd "$TMPDIR" && bash "$OLDPWD/scripts/check-forbidden-strings.sh") ; then
  echo "FAIL: script should have errored on bad.html"; exit 1
else
  echo "PASS: script correctly flagged forbidden string"
fi
