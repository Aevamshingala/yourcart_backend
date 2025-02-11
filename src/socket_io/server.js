import http from "http";
import { Server } from "socket.io";
import { room as Room } from "../models/socket_io_room.model.js";
import { newMessage } from "./socket.controller.js";
import { app } from "../app.js";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log("connection sucessfully in io");

  socket.on("joinRoom", async (room, callback) => {
    socket.join(room);
    console.log(room);

    let roomData = await Room.findOne({ room: room });

    if (!roomData) {
      roomData = await Room.create({
        room,
        message: {
          content: "Hello",
          timeStamp: new Date(),
        },
      });
    }
    await Room.Save;

    io.emit("joinRoom", true);
    callback({ success: true, message: "Successfully joined the room" });
    socket.emit("previousMessage", roomData.message);
  });

  socket.on("newChat", newMessage);
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// httpServer.listen(3000, () => {
//   console.log("server is ready");
// });

export { httpServer, io };
