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
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  passwordResetToken: String,
  passwordExpiration: Date,
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  profilePic: String,
  searchHistory: [{ type: Schema.Types.ObjectId, ref: "User" }],
  isPrivate: { require: true, type: Boolean, default: true },
  followRequestsRecieved: [{ type: Schema.Types.ObjectId, ref: "User" }],
  followRequestsSent: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const userModel = new model("User", userSchema);

export default userModel;
