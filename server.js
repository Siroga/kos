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
