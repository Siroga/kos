const { exec, spawn } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execAsync = promisify(exec);

let rfcommProcess = null;
let reconnectInterval = null;
let activeScanProcess = null;
let currentPrinterMac = null;
let isFreshConnection = false;

// Read config.json
async function getConfig() {
  const configPath = path.join(process.cwd(), "config.json");
  try {
    if (fs.existsSync(configPath)) {
      const data = await fs.promises.readFile(configPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading config.json:", e);
  }
  return { password: "JirkA1234", printerMac: null };
}

// Write to config.json
async function saveConfig(updates) {
  const configPath = path.join(process.cwd(), "config.json");
  try {
    const current = await getConfig();
    const updated = { ...current, ...updates };
    await fs.promises.writeFile(configPath, JSON.stringify(updated, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving config.json:", e);
    return false;
  }
}

// Check Bluetooth adapter state (Powered: yes/no)
async function checkAdapterStatus() {
  try {
    const { stdout } = await execAsync("bluetoothctl show");
    const powered = /Powered:\s+yes/i.test(stdout);
    return { powered };
  } catch (e) {
    console.error("Error checking adapter status:", e);
    return { powered: false, error: e.message };
  }
}

// Check if /dev/rfcomm0 exists
function checkConnection() {
  const devicePath = "/dev/rfcomm0";
  return fs.existsSync(devicePath);
}

// Scan Bluetooth devices (streams devices via onDevice callback, completes via onDone)
async function scanDevices(onDevice, onDone) {
  const adapter = await checkAdapterStatus();
  if (!adapter.powered) {
    if (onDone) onDone({ error: "Bluetooth-adaptér je vypnutý (Disabled)" });
    return;
  }

  // If a scan process is already running, clean it up
  if (activeScanProcess) {
    try {
      activeScanProcess.kill();
    } catch (e) { }
    activeScanProcess = null;
  }

  const discovered = new Set();

  try {
    activeScanProcess = spawn("bluetoothctl", [], { stdio: ["pipe", "pipe", "ignore"] });

    activeScanProcess.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        // Matches: [NEW] Device DC:0D:30:DE:18:39 DeviceName
        // or [CHG] Device DC:0D:30:DE:18:39 Name: DeviceName
        // or Device DC:0D:30:DE:18:39 DeviceName
        const match = line.match(/Device\s+([0-9A-FA-F:]{17})\s+(.*)/);
        if (match) {
          const mac = match[1];
          let name = match[2].replace(/^Name:\s*/, "").trim();
          if (!name || name === mac.replace(/:/g, "-")) {
            name = "Neznámé zařízení";
          }
          if (!discovered.has(mac)) {
            discovered.add(mac);
            if (onDevice) onDevice({ mac, name });
          }
        }
      }
    });

    activeScanProcess.stdin.write("scan on\n");

    // Scan for 10 seconds
    setTimeout(async () => {
      await stopScan();
      if (onDone) onDone({ success: true });
    }, 10000);

  } catch (e) {
    console.error("Scan error:", e);
    await stopScan();
    if (onDone) onDone({ error: e.message });
  }
}

async function stopScan() {
  if (activeScanProcess) {
    try {
      activeScanProcess.stdin.write("scan off\n");
      activeScanProcess.stdin.write("quit\n");
      activeScanProcess.kill();
    } catch (e) { }
    activeScanProcess = null;
  }
}

// Connect printer: pair, trust, connect, rfcomm bind
async function connectPrinter(mac) {
  if (!mac) return { success: false, error: "MAC adresa je prázdná" };

  try {
    // 0. Stop scanning before connecting so bluetoothctl devices stops filling with nearby un-paired devices
    await stopScan();

    // 1. Auto-confirm numeric passkey on phone using bluetoothctl interactive agent
    await new Promise((resolve) => {
      const bt = spawn("bluetoothctl", []);
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          try { bt.kill(); } catch (e) { }
          resolve();
        }
      };

      bt.stdout.on("data", (data) => {
        const str = data.toString();
        if (str.includes("Confirm passkey") || str.includes("yes/no")) {
          bt.stdin.write("yes\n");
        }
      });

      bt.stdin.write("agent NoInputNoOutput\n");
      bt.stdin.write("default-agent\n");
      bt.stdin.write(`pair ${mac}\n`);
      bt.stdin.write(`trust ${mac}\n`);
      bt.stdin.write(`connect ${mac}\n`);

      setTimeout(finish, 6000);
    });

    // 2. Trust
    try {
      await execAsync(`bluetoothctl trust ${mac}`);
    } catch (e) { }

    // 3. Connect via bluetoothctl
    try {
      await execAsync(`bluetoothctl connect ${mac}`);
    } catch (e) { }

    // 4. Release rfcomm 0 if active
    await disconnectRfcommProcess();

    // 5. Spawn rfcomm connect 0 <MAC> 1
    rfcommProcess = spawn("rfcomm", ["connect", "0", mac, "1"]);
    rfcommProcess.on("error", (err) => {
      console.error("rfcomm process error:", err);
    });
    rfcommProcess.on("exit", (code) => {
      console.log(`rfcomm process exited with code ${code}`);
      rfcommProcess = null;
    });

    // 6. Poll for /dev/rfcomm0 to appear (up to 5s)
    let connected = false;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (checkConnection()) {
        connected = true;
        break;
      }
    }

    if (connected) {
      currentPrinterMac = mac;
      isFreshConnection = true;
      // RFCOMM Settlement Delay (2 seconds)
      await new Promise((r) => setTimeout(r, 2000));
      isFreshConnection = false;
      return { success: true, mac };
    } else {
      await disconnectRfcommProcess();
      return { success: false, error: "Nepodařilo se vytvořit /dev/rfcomm0" };
    }

  } catch (e) {
    console.error("Error connecting printer:", e);
    await disconnectRfcommProcess();
    return { success: false, error: e.message };
  }
}

async function disconnectRfcommProcess() {
  if (rfcommProcess) {
    try {
      rfcommProcess.kill();
    } catch (e) { }
    rfcommProcess = null;
  }
  try {
    await execAsync("rfcomm release 0 2>/dev/null");
  } catch (e) { }
}

async function disconnectPrinter() {
  await disconnectRfcommProcess();
  currentPrinterMac = null;
  return { success: true };
}

// Remove / unpair all Bluetooth devices (paired or cached) and reset config
async function removeAllDevices() {
  try {
    stopReconnectLoop();
    await disconnectRfcommProcess();

    // 1. Get all devices from bluetoothctl devices & bluetoothctl paired-devices
    const { stdout: devOut } = await execAsync("bluetoothctl devices || true");
    const { stdout: pairedOut } = await execAsync("bluetoothctl paired-devices || true");
    const combined = devOut + "\n" + pairedOut;
    
    const macSet = new Set();
    const lines = combined.split("\n");
    for (const line of lines) {
      const match = line.match(/Device\s+([0-9A-FA-F:]{17})/i);
      if (match) {
        macSet.add(match[1]);
      }
    }

    // 2. Remove each device via interactive bluetoothctl session
    await new Promise((resolve) => {
      const bt = spawn("bluetoothctl", []);
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          try { bt.kill(); } catch (e) { }
          resolve();
        }
      };

      for (const mac of macSet) {
        bt.stdin.write(`untrust ${mac}\n`);
        bt.stdin.write(`disconnect ${mac}\n`);
        bt.stdin.write(`remove ${mac}\n`);
      }

      setTimeout(finish, 3000);
    });

    // 3. Fallback direct CLI removal
    for (const mac of macSet) {
      try { await execAsync(`bluetoothctl untrust ${mac}`); } catch (e) { }
      try { await execAsync(`bluetoothctl disconnect ${mac}`); } catch (e) { }
      try { await execAsync(`bluetoothctl remove ${mac}`); } catch (e) { }
    }

    // Direct cleanup in BlueZ storage if any persistent devices remain
    try {
      await execAsync("sudo rm -rf /var/lib/bluetooth/*/*/* 2>/dev/null || true");
      await execAsync("sudo systemctl restart bluetooth || true");
    } catch (e) { }

    await saveConfig({ printerMac: null });
    currentPrinterMac = null;
    return { success: true };
  } catch (e) {
    console.error("Error removing all devices:", e);
    return { success: false, error: e.message };
  }
}

// Reconnect loop (replaces bt_printer.sh)
function startReconnectLoop(mac) {
  stopReconnectLoop();
  if (!mac) return;

  currentPrinterMac = mac;

  // Initial attempt
  if (!checkConnection()) {
    connectPrinter(mac);
  }

  reconnectInterval = setInterval(() => {
    if (!checkConnection() && currentPrinterMac) {
      console.log("🔵 Connecting Bluetooth printer...", currentPrinterMac);
      connectPrinter(currentPrinterMac);
    }
  }, 10000);
}

function stopReconnectLoop() {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
}

// ESC/POS Print function
async function printMessage(message) {
  if (!checkConnection()) {
    return { success: false, error: "Tiskárna není připojena (/dev/rfcomm0 neexistuje)" };
  }

  // If newly connected within last 2 seconds, wait settlement delay
  if (isFreshConnection) {
    await new Promise((r) => setTimeout(r, 2000));
  }

  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const dateString = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const bigNumber = (message.number || 1).toString();
  const itemName = message.name || "Test";
  const itemNext = message.count ? `-${message.count}` : "";
  const comment = message.comment || "";

  const escposCommands = Buffer.concat([
    Buffer.from([0x1b, 0x40]), // ESC @ - initialize
    Buffer.from([0x1b, 0x61, 0x01]), // ESC a 1 - center alignment
    Buffer.from(dateString + "\n", "ascii"),
    Buffer.from([0x1d, 0x21, 0x77]), // GS ! 0x77 - max font size
    Buffer.from(bigNumber, "ascii"),
    Buffer.from("\n\n", "ascii"),
    Buffer.from([0x1d, 0x21, 0x00]),
    Buffer.from(itemName + itemNext, "ascii"),
    Buffer.from("\n", "ascii"),
    Buffer.from(comment, "ascii"),
    Buffer.from("\n\n\n\n\n", "ascii"),
    Buffer.from([0x1d, 0x56, 0x00]), // GS V 0 - cut paper
  ]);

  return new Promise((resolve) => {
    const stream = fs.createWriteStream("/dev/rfcomm0");
    stream.on("error", (err) => {
      console.error("Print error:", err.message);
      resolve({ success: false, error: err.message });
    });
    stream.on("open", () => {
      stream.write(escposCommands, () => {
        stream.end();
        resolve({ success: true });
      });
    });
  });
}

// Test Print
async function testPrint() {
  const testMsg = {
    number: 99,
    name: "ZKUŠEBNÍ TISK",
    count: 1,
    comment: "Test připojení tiskárny OK",
  };
  return await printMessage(testMsg);
}

// Cleanup process resources on server shutdown
function shutdownCleanup() {
  stopReconnectLoop();
  if (activeScanProcess) {
    try {
      activeScanProcess.kill();
    } catch (e) { }
  }
  if (rfcommProcess) {
    try {
      rfcommProcess.kill();
    } catch (e) { }
  }
}

process.on("SIGTERM", shutdownCleanup);
process.on("SIGINT", shutdownCleanup);

module.exports = {
  getConfig,
  saveConfig,
  checkAdapterStatus,
  checkConnection,
  scanDevices,
  stopScan,
  connectPrinter,
  disconnectPrinter,
  removeAllDevices,
  startReconnectLoop,
  stopReconnectLoop,
  printMessage,
  testPrint,
};
