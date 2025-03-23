import mongoose, { Mongoose, Schema } from "mongoose";

const PersonalMessageSchema = new Schema(
  {
    person1: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    person2: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    message: [
      {
        userName: {
          type: String,
          require: true,
        },
        content: {
          type: String,
          require: true,
        },
        timeStamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const PersonalMessage = mongoose.model(
  "PersonalMessage",
  PersonalMessageSchema
);
