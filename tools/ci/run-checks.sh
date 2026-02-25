#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORTS="$ROOT/evidence/reports"

mkdir -p "$REPORTS"

EXIT_CODE=0

echo "=== Running TypeScript type check ==="
npx tsc --noEmit > "$REPORTS/typecheck.txt" 2>&1 && {
  echo "TypeCheck: PASSED"
} || {
  echo "TypeCheck: FAILED"
  EXIT_CODE=1
}

echo ""
echo "=== Running ESLint ==="
npx eslint . --max-warnings=9999 > "$REPORTS/eslint.txt" 2>&1 && {
  echo "ESLint: PASSED"
} || {
  echo "ESLint: FAILED"
  EXIT_CODE=1
}

echo ""
echo "=== Running dependency audit ==="
npm audit --json > "$REPORTS/audit.json" 2>&1
AUDIT_EXIT=$?
if [ $AUDIT_EXIT -eq 0 ]; then
  echo "Audit: PASSED (no vulnerabilities)"
else
  echo "Audit: COMPLETED with advisories (exit $AUDIT_EXIT)"
  echo "See $REPORTS/audit.json for details"
fi

echo ""
echo "=== Unit tests ==="
if [ -f "$ROOT/jest.config.js" ] || [ -f "$ROOT/jest.config.ts" ] || grep -q '"jest"' "$ROOT/package.json" 2>/dev/null; then
  npx jest --ci --json --outputFile="$REPORTS/junit.json" 2>&1 && {
    echo "Tests: PASSED"
  } || {
    echo "Tests: FAILED"
    EXIT_CODE=1
  }
elif [ -f "$ROOT/vitest.config.ts" ] || [ -f "$ROOT/vitest.config.js" ]; then
  npx vitest run --reporter=json --outputFile="$REPORTS/junit.json" 2>&1 && {
    echo "Tests: PASSED"
  } || {
    echo "Tests: FAILED"
    EXIT_CODE=1
  }
else
  echo "No test runner configured (jest/vitest). Skipping unit tests."
  echo '{"skipped": true, "reason": "No test runner configured"}' > "$REPORTS/junit.json"
fi

echo ""
echo "=== Checks complete ==="
exit $EXIT_CODE
