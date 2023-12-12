import { Router } from "express";
import isValidUser from "../utils/isValidUser.js";
import userModel from "../models/User.js";

const loggedInRouter = Router();

loggedInRouter.get("/loggedIn", isValidUser, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.userId)
      .populate("posts")
      .populate("searchHistory")
      .populate("followRequestsRecieved");
    if (!user) {
      const err = new Error("User doesn't exist");
      err.statusCode = 401;
      throw err;
    } else {
      res.status(200).json({ isLoggedIn: true, user: user });
    }
  } catch (err) {
    next(err);
  }
});

export default loggedInRouter;
