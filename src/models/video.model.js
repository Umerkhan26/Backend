import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoShema = new Schema(
  {
    vidioFile: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: true,
      required: true,
    },
    title: {
      type: true,
      required: true,
    },
    description: {
      type: true,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    views: {
      type: Boolean,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

videoShema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.modal("Video", videoShema);
