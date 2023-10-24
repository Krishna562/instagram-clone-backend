import { Router } from "express";
import {
  getAllUsers,
  getSpecificUser,
  getSpecificUserById,
} from "../controllers/users.js";
import isValidUser from "../utils/isValidUser.js";

const usersRouter = Router();

usersRouter.get("/allUsers", isValidUser, getAllUsers);

usersRouter.get("/specificUser/:username", isValidUser, getSpecificUser);

usersRouter.get("/specific-user/:userId", isValidUser, getSpecificUserById);

export default usersRouter;
