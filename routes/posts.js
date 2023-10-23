import express from "express";
import { createPost, likePost, addComment } from "../controllers/posts.js";
import isValidUser from "../utils/isValidUser.js";

const postsRouter = express.Router();

postsRouter.put("/createPost", isValidUser, createPost);

postsRouter.patch("/like-post", isValidUser, likePost);

postsRouter.patch("/add-comment", isValidUser, addComment);

export default postsRouter;
