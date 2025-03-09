import mongoose, { Schema } from "mongoose";

const likeSchema = mongoose.Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "post",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);
export const Like = mongoose.model("like", likeSchema);
