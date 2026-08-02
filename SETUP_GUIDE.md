# Setup Guide: Bluetooth Printer & Server Configuration (Raspberry Pi 5)

This document provides system administrators with setup instructions for configuring a new Raspberry Pi 5 server to run the **KOS POS** application with Bluetooth ESC/POS thermal printer support.

---

## 1. System Requirements

- **Device**: Raspberry Pi 5 (or Raspberry Pi 4)
- **OS**: Raspberry Pi OS (Bookworm 64-bit recommended)
- **Node.js**: v18.x or v20.x
- **Bluetooth Stack**: `bluez`, `rfcomm`

---

## 2. User Permissions Setup (One-Time Setup)

The application runs via Node.js without `sudo`. To enable Bluetooth device scanning, pairing, and serial binding (`/dev/rfcomm0`), the system user executing the server (e.g. `pi`) **must be added to system groups**:

```bash
sudo usermod -aG bluetooth,dialout,tty pi
```

> ⚠️ **Important**: After running `usermod`, you **must log out and log back in** (or reboot) for group changes to take effect:
> ```bash
> sudo reboot
> ```

Verify group membership:
```bash
groups pi
# Output must include: pi adm dialout tty bluetooth ...
```

---

## 3. Bluetooth Adapter Verification

Ensure the Bluetooth adapter is powered on and unblocked:

```bash
# Check rfkill status
rfkill unblock bluetooth

# Check adapter powered state via bluetoothctl
bluetoothctl show
```

The output must show `Powered: yes`.

---

## 4. Application Installation & PM2 Setup

```bash
# Clone the repository
git clone <repo-url> /home/pi/kos
cd /home/pi/kos

# Install dependencies
npm install

# Build Next.js
npm run build

# Start with PM2
npm install -g pm2
pm2 start server.js --name kos
pm2 save
pm2 startup
```

---

## 5. `config.json` Reference

The project root configuration file is located at `/home/pi/kos/config.json`.

```json
{
  "password": "JirkA1234",
  "printerMac": "DC:0D:30:DE:18:39"
}
```

| Property | Type | Description |
|---|---|---|
| `password` | `string` | Access password for `/settings` and initial login prompt. |
| `printerMac` | `string \| null` | MAC address of the paired Bluetooth thermal printer. |

---

## 6. Troubleshooting & Diagnostics

### A. `/dev/rfcomm0` is busy / blocked
If `/dev/rfcomm0` becomes stuck, release the RFCOMM channel manually:
```bash
rfcomm release 0
```

### B. Printer Not Found in Scan
1. Ensure the printer is powered on and in pairing mode.
2. Verify Bluetooth status: `bluetoothctl show`.
3. Test scanning via shell: `bluetoothctl scan on`.

### C. PM2 Process Logs
Inspect server logs for Bluetooth & print events:
```bash
pm2 logs kos
```
