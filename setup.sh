#!/bin/bash
set -e

# Automatically detect the repository directory where this script is located
KOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting automated setup of KOS POS server..."
echo "📂 Project root detected at: $KOS_DIR"

# 1. System update and required packages installation
echo "📦 1/6. Updating packages and installing Chromium, unclutter, jq..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y unclutter jq git curl || true
sudo apt install -y chromium || sudo apt install -y chromium-browser

# 2. User permissions setup (dynamically using $USER)
echo "👤 2/6. Adding user '$USER' to bluetooth, dialout, tty groups..."
sudo usermod -aG bluetooth,dialout,tty $USER
sudo rfkill unblock bluetooth || true

# 3. Installing NVM and Node.js 20
echo "🟢 3/6. Installing NVM and Node.js 20..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 20
nvm alias default 20
nvm use 20

# 4. Installing and configuring PM2
echo "⚙️ 4/6. Setting up PM2..."
npm install -g pm2

# Automatically register PM2 service in systemd
NODE_BIN=$(which node)
NODE_DIR=$(dirname $NODE_BIN)
sudo env PATH=$PATH:$NODE_DIR pm2 startup systemd -u $USER --hp $HOME --force

# 5. Installing dependencies and building the project
echo "📁 5/6. Installing dependencies and building project..."
cd "$KOS_DIR"
npm install
npm run build

# Start service in PM2 and save state
pm2 start server.js --name kos || pm2 restart kos
pm2 save

# 6. Configuring Chromium Kiosk mode
echo "🖥️ 6/6. Setting up Chromium Kiosk autostart..."

chmod +x "$KOS_DIR/startup.sh"

# Set up autostart for Wayland / Labwc (Raspberry Pi OS Bookworm)
mkdir -p "$HOME/.config/labwc"
if ! grep -q "$KOS_DIR/startup.sh" "$HOME/.config/labwc/autostart" 2>/dev/null; then
    echo "$KOS_DIR/startup.sh &" >> "$HOME/.config/labwc/autostart"
fi

echo "-------------------------------------------------------"
echo "✅ Setup successfully completed!"
echo "⚠️  IMPORTANT: Reboot the system for group permissions and autostart to take effect:"
echo "    sudo reboot"
echo "-------------------------------------------------------"
