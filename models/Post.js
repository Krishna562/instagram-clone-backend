import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
    caption: String,
    postImg: {
      require: true,
      type: String,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      { userId: { type: Schema.Types.ObjectId, ref: "User" }, comment: String },
    ],
    tags: [
      { username: { type: String, ref: "User" }, position: { type: Object } },
    ],
  },
  { timestamps: true }
);

const postModel = new model("Post", postSchema);

export default postModel;
