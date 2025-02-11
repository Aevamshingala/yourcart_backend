import { io } from "./server.js";
import { room as Room } from "../models/socket_io_room.model.js";
import { Apierror } from "../utils/apiError.js";
const newMessage = async ({ room, content }) => {
  // const { room, user, content } = req.body;
  console.log(content);
  console.log(typeof content);

  try {
    if (!room) {
      throw new Apierror(404, "room is not selected");
    }
    // if (!user) {
    //   throw new Apierror(404, "invalid user");
    // }
    if (!content) {
      throw new Apierror(404, "pleace write message");
    }

    const newMessage = {
      content,
      timeStamp: new Date(),
    };
    await Room.updateOne(
      {
        room,
      },
      {
        $push: { message: newMessage },
      }
    );

    io.to(room).emit("newChat", newMessage);
  } catch (error) {
    console.log("error", error);
    // next(error);
  }
};

export { newMessage };
