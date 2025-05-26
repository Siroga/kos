const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 8888;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
let items = [];
let lastIndex = 0;
let pizzaCount = 0;
let todayDate = new Date();
const fs = require("fs");

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log(socket.id);

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

    setInterval(() => {
      io.emit("priter_status", checkConnection()); // Broadcast the message to all connected clients
    }, 10000); // every hour

    socket.on("connect", (message) => {
      console.log("connect");
    });
    // Handle chat messages
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
      }); // Broadcast the message to all connected clients
      print(message);

      items = items.map((item) => {
        item.sound = false;
        return item;
      });
    });

    socket.on("update_item", (message) => {
      console.log("start");
      if (message.status === "Ready" || message.status === "Progress") {
        items.map((item) => {
          if (item.number === message.number) {
            item.status = message.status;
          }
        });
        console.log("updated");
      } else if (message.status === "Done") {
        items = items.filter(function (el) {
          return el.number != message.number;
        });
        console.log("updated");
      }

      console.log("done");
      if (todayDate.getDay() !== new Date().getDay()) {
        todayDate = new Date();
        pizzaCount = 0;
      }
      io.emit("items_list", {
        items: items,
        lastIndex: lastIndex,
        pizzaCount: pizzaCount,
      }); // Broadcast the message to all connected clients
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
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

function checkConnection() {
  const devicePath = "/dev/rfcomm0";
  if (!fs.existsSync(devicePath)) {
    return false;
  }
  return true;
}

function print(message) {
  const bigNumber = lastIndex.toString();
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const dateString =
    `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  //const dateString = now.toLocaleString();
  // Create Buffer with commands and text:
  const escposCommands = Buffer.concat([
    Buffer.from([0x1b, 0x40]), // ESC @ - initialize
    Buffer.from([0x1b, 0x61, 0x01]), // ESC a 1 - center alignment
    Buffer.from(dateString + "\n", "ascii"),
    Buffer.from([0x1d, 0x21, 0x77]), // GS ! 0x77 - max font size (8x8)
    Buffer.from(bigNumber, "ascii"), // text (number)
    Buffer.from("\n\n", "ascii"), // new lines (feed paper)
    Buffer.from([0x1d, 0x21, 0x00]),
    Buffer.from(message.name + "-" + message.count, "ascii"), // new lines (feed paper)
    Buffer.from("\n", "ascii"), // new lines (feed paper)
    Buffer.from(message.comment, "ascii"), // new lines (feed paper)
    Buffer.from("\n\n\n\n\n", "ascii"), // new lines (feed paper)
    Buffer.from([0x1d, 0x56, 0x00]), // GS V 0 - cut paper
  ]);
  // Open device file
  const devicePath = "/dev/rfcomm0";
  if (!fs.existsSync(devicePath)) {
    return;
  }

  const stream = fs.createWriteStream(devicePath);
  stream.on("error", (err) => {
    console.error("Print error:", err.message);
  });
  stream.on("open", () => {
    stream.write(escposCommands, () => {
      stream.end();
    });
  });
}
