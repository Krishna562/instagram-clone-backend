import { Schema, model } from "mongoose";

const verificationSchema = new Schema({
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
  token: {
    require: true,
    type: String,
  },
});

const verificationModel = new model("Verification", verificationSchema);
export default verificationModel;
