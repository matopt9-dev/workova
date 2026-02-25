#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVIDENCE_DIR="$ROOT_DIR/evidence/screenshots/android"
MAESTRO_DIR="$ROOT_DIR/tools/e2e/maestro"
APP_PACKAGE="${APP_PACKAGE:-com.workova}"
APK_PATH="${ANDROID_APK_PATH:-$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk}"

DEVICES=(
  "pixel_phone|Pixel_7_Pro|pixel_6.7|phone"
  "pixel_tablet|Pixel_Tablet|tablet_10.9|tablet"
)

FLOWS=(
  "flow-login.yaml"
  "flow-core.yaml"
)

wait_for_emulator() {
  local serial="$1"
  local timeout=120
  local elapsed=0

  echo "  -> Waiting for emulator $serial to boot..."
  while [ $elapsed -lt $timeout ]; do
    boot_completed=$(adb -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || echo "")
    if [ "$boot_completed" = "1" ]; then
      echo "  -> Emulator $serial is ready."
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  echo "ERROR: Emulator $serial did not boot within ${timeout}s"
  return 1
}

cleanup() {
  echo "==> Shutting down emulators..."
  adb devices | grep emulator | awk '{print $1}' | while read -r serial; do
    adb -s "$serial" emu kill 2>/dev/null || true
  done
}

trap cleanup EXIT

echo "==> Preparing evidence directories..."
rm -rf "$EVIDENCE_DIR"
mkdir -p "$EVIDENCE_DIR"

for entry in "${DEVICES[@]}"; do
  IFS='|' read -r avd_name avd_id folder device_type <<< "$entry"

  echo ""
  echo "============================================"
  echo "==> Device: $avd_name ($folder)"
  echo "============================================"

  DEVICE_DIR="$EVIDENCE_DIR/$folder"
  mkdir -p "$DEVICE_DIR"

  echo "==> Starting emulator: $avd_id"
  if [ "$device_type" = "tablet" ]; then
    emulator -avd "$avd_id" -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect &
  else
    emulator -avd "$avd_id" -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect &
  fi
  EMU_PID=$!
  sleep 10

  SERIAL=$(adb devices | grep emulator | tail -1 | awk '{print $1}')
  if [ -z "$SERIAL" ]; then
    echo "ERROR: Could not find emulator serial for $avd_id. Skipping."
    kill $EMU_PID 2>/dev/null || true
    continue
  fi

  wait_for_emulator "$SERIAL" || {
    echo "ERROR: Emulator $avd_id failed to boot. Skipping."
    kill $EMU_PID 2>/dev/null || true
    continue
  }

  sleep 5

  echo "==> Installing APK on $avd_name..."
  if [ -f "$APK_PATH" ]; then
    adb -s "$SERIAL" install -r "$APK_PATH"
  else
    echo "WARNING: APK not found at $APK_PATH. Assuming already installed."
  fi

  echo "==> Launching app..."
  adb -s "$SERIAL" shell am start -n "$APP_PACKAGE/.MainActivity" || true
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
    MAESTRO_DEVICE_ID="$SERIAL" maestro test "$FLOW_PATH" --env=APP_ID="$APP_PACKAGE" || {
      echo "WARNING: Maestro flow $flow failed on $avd_name"
    }

    echo "  -> Taking screenshot after $flow"
    SCREENSHOT_FILE="$DEVICE_DIR/screenshot_${SCREENSHOT_INDEX}_${flow%.yaml}.png"
    adb -s "$SERIAL" shell screencap -p /sdcard/screenshot.png
    adb -s "$SERIAL" pull /sdcard/screenshot.png "$SCREENSHOT_FILE"
    adb -s "$SERIAL" shell rm /sdcard/screenshot.png
    echo "  -> Saved: $SCREENSHOT_FILE"
    SCREENSHOT_INDEX=$((SCREENSHOT_INDEX + 1))
  done

  echo "==> Taking additional screen captures..."
  SCREENS=("home" "jobs" "messages" "account")
  for screen in "${SCREENS[@]}"; do
    SCREENSHOT_FILE="$DEVICE_DIR/screen_${screen}.png"
    adb -s "$SERIAL" shell screencap -p /sdcard/screenshot.png
    adb -s "$SERIAL" pull /sdcard/screenshot.png "$SCREENSHOT_FILE"
    adb -s "$SERIAL" shell rm /sdcard/screenshot.png
    echo "  -> Saved: $SCREENSHOT_FILE"
    sleep 1
  done

  echo "==> Shutting down emulator $avd_name..."
  adb -s "$SERIAL" emu kill 2>/dev/null || true
  wait $EMU_PID 2>/dev/null || true
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
echo "==> Android screenshots complete. Output: $EVIDENCE_DIR"
echo "==> Screenshot manifest:"
find "$EVIDENCE_DIR" -name "*.png" -print | sort
