const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const fs = require("fs");
const bt = require("./bluetooth");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 8888;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

let items = [];
let lastIndex = 0;
let pizzaCount = 0;
let todayDate = new Date();

app.prepare().then(async () => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  // Auto-connect printer from config.json on startup
  const config = await bt.getConfig();
  if (config.printerMac) {
    console.log(`Initializing BT reconnect loop for saved printer: ${config.printerMac}`);
    bt.startReconnectLoop(config.printerMac);
  }

  setInterval(() => {
    io.emit("priter_status", bt.checkConnection()); // Broadcast printer status
  }, 5000);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    setTimeout(() => {
      if (todayDate.getDay() !== new Date().getDay()) {
        todayDate = new Date();
        pizzaCount = 0;
      }

      socket.emit("items_list", {
        items: items,
        lastIndex: lastIndex,
        pizzaCount: pizzaCount,
      });
    }, 500);

    // Bluetooth printer management events
    socket.on("bt_check_adapter", async () => {
      const status = await bt.checkAdapterStatus();
      socket.emit("bt_adapter_status", status);
    });

    socket.on("bt_get_config", async () => {
      const cfg = await bt.getConfig();
      socket.emit("bt_config_data", { printerMac: cfg.printerMac || null });
    });

    socket.on("bt_scan_start", () => {
      bt.scanDevices(
        (device) => {
          socket.emit("bt_scan_result", device);
        },
        (res) => {
          socket.emit("bt_scan_done", res);
        }
      );
    });

    socket.on("bt_scan_stop", () => {
      bt.stopScan();
      socket.emit("bt_scan_done", { success: true });
    });

    socket.on("bt_connect", async (data) => {
      const mac = data && data.mac;
      if (!mac) {
        socket.emit("bt_connect_status", { success: false, error: "Chybí MAC adresa" });
        return;
      }

      const res = await bt.connectPrinter(mac);
      if (res.success) {
        await bt.saveConfig({ printerMac: mac });
        bt.startReconnectLoop(mac);
      }
      socket.emit("bt_connect_status", res);
      io.emit("priter_status", bt.checkConnection());
    });

    socket.on("bt_disconnect", async () => {
      bt.stopReconnectLoop();
      const res = await bt.disconnectPrinter();
      await bt.saveConfig({ printerMac: null });
      socket.emit("bt_connect_status", { success: false, mac: null });
      io.emit("priter_status", false);
    });

    socket.on("bt_test_print", async () => {
      const res = await bt.testPrint();
      socket.emit("bt_print_result", res);
    });

    // Handle order items
    socket.on("add_item", (message) => {
      if (todayDate.getDay() !== new Date().getDay()) {
        todayDate = new Date();
        pizzaCount = 0;
      }
      lastIndex = message.number;
      items.push(message);

      if (message.type === 1) {
        pizzaCount++;
      }
      io.emit("items_list", {
        items: items,
        lastIndex: lastIndex,
        pizzaCount: pizzaCount,
      });

      bt.printMessage(message);

      items = items.map((item) => {
        item.sound = false;
        return item;
      });
    });

    socket.on("update_item", (message) => {
      if (message.status === "Ready" || message.status === "Progress") {
        items.map((item) => {
          if (item.number === message.number) {
            item.status = message.status;
          }
        });
      } else if (message.status === "Done") {
        items = items.filter((el) => el.number != message.number);
      }

      if (todayDate.getDay() !== new Date().getDay()) {
        todayDate = new Date();
        pizzaCount = 0;
      }
      io.emit("items_list", {
        items: items,
        lastIndex: lastIndex,
        pizzaCount: pizzaCount,
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
