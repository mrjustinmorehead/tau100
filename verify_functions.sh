#!/usr/bin/env bash
set -euo pipefail
for f in netlify/functions/*.mjs; do echo '---' $f; head -c 4 "$f" | od -An -t x1; head -n 2 "$f"; done
