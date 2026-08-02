#!/bin/bash
unclutter -idle 0.1 -root &

CHROMIUM_BIN="chromium"
if ! command -v chromium &> /dev/null; then
    CHROMIUM_BIN="chromium-browser"
fi

# Waiting for Next.js server to respond
while ! curl -s --fail http://localhost:8888 > /dev/null; do
    sleep 2
done

$CHROMIUM_BIN --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --hide-scrollbars \
  --enable-offline-auto-reload \
  --enable-offline-auto-reload-visible-only \
  --check-for-update-interval=31536000 \
  http://localhost:8888/tv