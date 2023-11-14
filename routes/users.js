import { Router } from "express";
import {
  getAllUsers,
  getSpecificUser,
  getSpecificUserById,
  updateUser,
  followUser,
  getTaggedPosts,
  getPeople,
  updateUserSearchHistory,
  toggleAccountVisibility,
  handleFollowRequest,
} from "../controllers/users.js";
import isValidUser from "../utils/isValidUser.js";

const usersRouter = Router();

usersRouter.get("/allUsers", isValidUser, getAllUsers);

usersRouter.get("/specificUser/:username", isValidUser, getSpecificUser);

usersRouter.get("/specific-user/:userId", isValidUser, getSpecificUserById);

usersRouter.patch("/update-user", isValidUser, updateUser);

usersRouter.patch("/follow-user", isValidUser, followUser);

usersRouter.get("/tagged-posts/:username", isValidUser, getTaggedPosts);

usersRouter.get("/get-people/:userId", isValidUser, getPeople);

usersRouter.put("/update-history", isValidUser, updateUserSearchHistory);

usersRouter.put("/toggle-account-visibility", toggleAccountVisibility);

usersRouter.put("/follow-request", isValidUser, handleFollowRequest);

export default usersRouter;
