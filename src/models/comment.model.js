import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);
commentSchema.plugin(mongooseAggregatePaginate); // To gave control over the pagination of the comments, we can use this plugin to paginate the comments and get the comments in a paginated way.

export const Comment = moongoose.model("Comment", commentSchema);
