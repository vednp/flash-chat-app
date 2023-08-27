const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = process.env.PORT || 3000;
const Filter = require("bad-words");
const publicPath = path.join(__dirname, "../public");
const { genrateMessage, genrateLocation } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
app.use(express.static(publicPath));

io.on("connection", (socket) => {
  console.log("New Connection!");
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit("message", genrateMessage("Admin", `Welcome ${user.username}`));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        genrateMessage("Admin", `${user.username} Has Joined The Chat`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });
  socket.on("sendMessage", (msg, callback) => {
    // const filter = new Filter
    const user = getUser(socket.id);
    io.to(user.room).emit("message-send", genrateMessage(user.username, msg));
    callback("delivered");
  });
  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "location-url",
      genrateLocation(
        user.username,
        `https://google.com/maps?q=${location.latitude},${location.longitude}`
      )
    );
    callback();
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        genrateMessage("Admin", `${user.username} Has Left The Chat`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(publicPath + "/index.html");
});

server.listen(port);
