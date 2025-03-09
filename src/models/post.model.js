import mongoose from "mongoose";
import { Schema } from "mongoose";

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    creater: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    likeCount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model("post", postSchema);
