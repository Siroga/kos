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

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log(socket.id);
    socket.emit("items_list", items);

    // Handle chat messages
    socket.on("add_item", (message) => {
      items.push(message);
      io.emit("items_list", items); // Broadcast the message to all connected clients

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
      io.emit("items_list", items); // Broadcast the message to all connected clients
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
