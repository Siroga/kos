#!/bin/bash

DEVICE=DC:0D:30:DE:19:D2
RFCOMM_DEV=/dev/rfcomm0
NODE_SCRIPT="/home/pi/print_server.js"

while true; do
  if [ ! -e "$RFCOMM_DEV" ]; then
    echo "🔵 Connecting Bluetooth printer..."
    sudo rfcomm release 0
    sudo rfcomm connect 0 $DEVICE 1 &
    sleep 5
  fi

  if [ -e "$RFCOMM_DEV" ]; then
    echo "✅ Printer connected"
    # Restart Node.js so it reopens the new /dev/rfcomm0
    #pkill -f "$NODE_SCRIPT"
    #node "$NODE_SCRIPT" &
  else
    echo "⚠️ Failed to connect. Retrying in 10 seconds..."
  fi

  sleep 10
done