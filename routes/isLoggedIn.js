import { Router } from "express";
import isValidUser from "../utils/isValidUser.js";
import userModel from "../models/User.js";

const loggedInRouter = Router();

loggedInRouter.get("/loggedIn", isValidUser, async (req, res) => {
  const user = await userModel.findById(req.userId).populate("posts");
  res.status(200).json({ isLoggedIn: true, user: user });
});

export default loggedInRouter;
