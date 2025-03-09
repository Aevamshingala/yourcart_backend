import mongoose, { Schema } from "mongoose";

const RoomSchema = new Schema(
  {
    room: {
      type: String,
      required: true,
      unique: true,
    },
    message: [
      {
        user: {
          type: String,
          // requierd: true,
        },
        content: {
          type: String,
          required: true,
        },
        timeStamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const room = mongoose.model("room", RoomSchema);
