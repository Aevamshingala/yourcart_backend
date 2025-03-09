import io from "./server.js";
import { PersonalMessage } from "../models/personalMessage.js";

async function joinMeToUser({ receiverId, senderId }) {
  let conversation = await PersonalMessage.findOne({
    $or: [
      { person1: senderId, person2: receiverId },
      { person1: receiverId, person2: senderId },
    ],
  });
  if (!conversation) {
    conversation = await PersonalMessage.create({
      person1: receiverId,
      person2: senderId,
      message: {
        userName: "System",
        content: "hi",
        timeStamp: new Date(),
      },
    });
  }
  await PersonalMessage.Save;

  Socket.join(conversation?._id);

  io.emit("joinMeToUser", true);

  callback({ success: true, message: "Successfully joined the room" });

  socket.emit("previousMessage", conversation.message);
}
export { joinMeToUser };
