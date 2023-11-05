import express from "express";
import {
  createPost,
  likePost,
  addComment,
  deleteComment,
  getAllPosts,
  deletePost,
  editPost,
} from "../controllers/posts.js";
import isValidUser from "../utils/isValidUser.js";

const postsRouter = express.Router();

postsRouter.put("/createPost", isValidUser, createPost);

postsRouter.patch("/like-post", isValidUser, likePost);

postsRouter.patch("/add-comment", isValidUser, addComment);

postsRouter.patch("/delete-comment", isValidUser, deleteComment);

postsRouter.get("/all-posts", isValidUser, getAllPosts);

postsRouter.delete("/delete-post/:postId", isValidUser, deletePost);

postsRouter.patch("/edit-post/:postId", isValidUser, editPost);

export default postsRouter;
