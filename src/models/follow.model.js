import mongoose, { Schema } from "mongoose";

const followShema = new mongoose.Schema(
  {
    whoFollow: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    whomToFollow: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

export const follow = mongoose.model("follow", followShema);
