import { Schema, model } from "mongoose";

const userSchema = new Schema({
  username: {
    require: true,
    type: String,
  },
  email: {
    require: true,
    type: String,
  },
  password: {
    require: true,
    type: String,
  },
  followers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
    },
  ],
  following: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
    },
  ],
  passwordResetToken: String,
  passwordExpiration: Date,
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  profilePic: String,
  story: Array,
});

const userModel = new model("User", userSchema);

export default userModel;
