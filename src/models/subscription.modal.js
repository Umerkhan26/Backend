import mongoose, { Schema, Types } from "mongoose";

const tweeSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      lowerCase: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const Tweet = mongoose.model("Tweet", tweeSchema);
