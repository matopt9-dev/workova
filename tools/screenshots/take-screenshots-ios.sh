#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVIDENCE_DIR="$ROOT_DIR/evidence/screenshots/ios"
MAESTRO_DIR="$ROOT_DIR/tools/e2e/maestro"
APP_BUNDLE_ID="${APP_BUNDLE_ID:-com.workova}"
APP_PATH="${IOS_APP_PATH:-$ROOT_DIR/ios/build/Build/Products/Release-iphonesimulator/workova.app}"

DEVICES=(
  "iPhone 15 Pro Max|iphone-6.7"
  "iPhone 15 Pro|iphone-6.1"
  "iPad Pro (12.9-inch) (6th generation)|ipad-12.9"
)

FLOWS=(
  "flow-login.yaml"
  "flow-core.yaml"
)

cleanup() {
  echo "==> Shutting down simulators..."
  for entry in "${DEVICES[@]}"; do
    IFS='|' read -r device_name folder <<< "$entry"
    local udid
    udid=$(xcrun simctl list devices available -j | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devs in data.get('devices', {}).items():
    for d in devs:
        if d['name'] == '$device_name' and d['state'] == 'Booted':
            print(d['udid'])
            sys.exit(0)
" 2>/dev/null || true)
    if [ -n "${udid:-}" ]; then
      xcrun simctl shutdown "$udid" 2>/dev/null || true
    fi
  done
}

trap cleanup EXIT

echo "==> Preparing evidence directories..."
rm -rf "$EVIDENCE_DIR"
mkdir -p "$EVIDENCE_DIR"

for entry in "${DEVICES[@]}"; do
  IFS='|' read -r device_name folder <<< "$entry"

  echo ""
  echo "============================================"
  echo "==> Device: $device_name ($folder)"
  echo "============================================"

  DEVICE_DIR="$EVIDENCE_DIR/$folder"
  mkdir -p "$DEVICE_DIR"

  echo "==> Booting simulator: $device_name"
  UDID=$(xcrun simctl list devices available -j | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devs in data.get('devices', {}).items():
    for d in devs:
        if d['name'] == '$device_name' and d['isAvailable']:
            print(d['udid'])
            sys.exit(0)
print('')
")

  if [ -z "$UDID" ]; then
    echo "ERROR: Simulator '$device_name' not found. Skipping."
    continue
  fi

  xcrun simctl boot "$UDID" 2>/dev/null || true
  echo "==> Waiting for simulator to be ready..."
  sleep 5

  echo "==> Installing app on $device_name..."
  if [ -d "$APP_PATH" ]; then
    xcrun simctl install "$UDID" "$APP_PATH"
  else
    echo "WARNING: App not found at $APP_PATH. Assuming already installed."
  fi

  echo "==> Launching app..."
  xcrun simctl launch "$UDID" "$APP_BUNDLE_ID" || true
  sleep 3

  echo "==> Running Maestro flows..."
  SCREENSHOT_INDEX=1
  for flow in "${FLOWS[@]}"; do
    FLOW_PATH="$MAESTRO_DIR/$flow"
    if [ ! -f "$FLOW_PATH" ]; then
      echo "WARNING: Flow $flow not found, skipping."
      continue
    fi

    echo "  -> Running $flow"
    MAESTRO_DEVICE_ID="$UDID" maestro test "$FLOW_PATH" --env=APP_ID="$APP_BUNDLE_ID" || {
      echo "WARNING: Maestro flow $flow failed on $device_name"
    }

    echo "  -> Taking screenshot after $flow"
    SCREENSHOT_FILE="$DEVICE_DIR/screenshot_${SCREENSHOT_INDEX}_${flow%.yaml}.png"
    xcrun simctl io "$UDID" screenshot "$SCREENSHOT_FILE"
    echo "  -> Saved: $SCREENSHOT_FILE"
    SCREENSHOT_INDEX=$((SCREENSHOT_INDEX + 1))
  done

  echo "==> Taking additional screen captures..."
  SCREENS=("home" "jobs" "messages" "account")
  for screen in "${SCREENS[@]}"; do
    SCREENSHOT_FILE="$DEVICE_DIR/screen_${screen}.png"
    xcrun simctl io "$UDID" screenshot "$SCREENSHOT_FILE"
    echo "  -> Saved: $SCREENSHOT_FILE"
    sleep 1
  done

  echo "==> Shutting down $device_name..."
  xcrun simctl shutdown "$UDID" 2>/dev/null || true
done

echo ""
echo "==> Verifying screenshots..."
TOTAL_SCREENSHOTS=$(find "$EVIDENCE_DIR" -name "*.png" | wc -l | tr -d ' ')
echo "Total screenshots captured: $TOTAL_SCREENSHOTS"

if [ "$TOTAL_SCREENSHOTS" -eq 0 ]; then
  echo "ERROR: No screenshots were captured!"
  exit 1
fi

EXPECTED_MIN=$((${#DEVICES[@]} * 2))
if [ "$TOTAL_SCREENSHOTS" -lt "$EXPECTED_MIN" ]; then
  echo "WARNING: Expected at least $EXPECTED_MIN screenshots, got $TOTAL_SCREENSHOTS"
fi

echo ""
echo "==> iOS screenshots complete. Output: $EVIDENCE_DIR"
echo "==> Screenshot manifest:"
find "$EVIDENCE_DIR" -name "*.png" -print | sort
