#!/usr/bin/env bash
# Static route smoke test.
#
# Fetches a small set of canonical URLs against a deployed origin and
# fails if any returns a non-2xx status. Use after publishing to confirm
# the SPA shell, deep-link fallback, and static JSON feeds are all
# reachable.
#
# Usage:
#   scripts/smoke-test.sh https://<user>.github.io/<repo>
#   scripts/smoke-test.sh http://localhost:4173            # local preview
#
# The script also accepts BASE_URL as an environment variable.

set -euo pipefail

BASE="${1:-${BASE_URL:-}}"
if [[ -z "$BASE" ]]; then
  echo "usage: $0 <base-url>" >&2
  echo "  e.g. $0 https://user.github.io/wgbiba" >&2
  exit 2
fi
BASE="${BASE%/}"  # strip trailing slash

# Paths to probe. Add more here if new public assets are introduced.
PATHS=(
  "/"
  "/about"
  "/data/tasks.json"
  "/data/projects.json"
  "/data/research.json"
)

fail=0
echo "Smoke test against $BASE"
echo "------------------------------------------------------------"
for p in "${PATHS[@]}"; do
  url="${BASE}${p}"
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "$url" || echo "000")
  if [[ "$code" =~ ^2 ]]; then
    printf "  %-30s %s OK\n" "$p" "$code"
  else
    printf "  %-30s %s FAIL\n" "$p" "$code"
    fail=$((fail + 1))
  fi
done
echo "------------------------------------------------------------"

if [[ $fail -gt 0 ]]; then
  echo "Smoke test FAILED: $fail of ${#PATHS[@]} URLs returned non-2xx." >&2
  exit 1
fi
echo "Smoke test passed: ${#PATHS[@]}/${#PATHS[@]} URLs OK."
