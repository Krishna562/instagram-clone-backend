import postModel from "../models/Post.js";
import userModel from "../models/User.js";
import { deleteFile } from "../utils/deleteFile.js";
import cloudinary from "cloudinary";

export const createPost = async (req, res, next) => {
  const imgFile = req.file;
  const { caption, tags } = req.body;
  const parsedTags = JSON.parse(tags);
  const isProductionMode = process.env.NODE_ENV === "production" ? true : false;

  const apiUrl = isProductionMode
    ? process.env.ONRENDER_API_URL
    : process.env.API_URL;

  // UPLOADING TO CLOUDINARY

  const cloudinaryUploadUrl = `${apiUrl}/images/${imgFile.filename}`;
  let uploadResult;

  if (isProductionMode) {
    try {
      uploadResult = await cloudinary.v2.uploader.upload(cloudinaryUploadUrl);
    } catch (err) {
      console.log(err);
    }
  }

  try {
    const newPost = new postModel({
      creatorId: req.userId,
      caption: caption,
      postImg: isProductionMode ? uploadResult.secure_url : cloudinaryUploadUrl,
      postImgId: isProductionMode ? uploadResult.public_id : "0",
      tags: parsedTags,
    });
    await newPost.populate("creatorId");
    await newPost.save();
    const user = await userModel.findById(req.userId);
    user.posts.push(newPost);
    user.save();
    res.json({ newPost: newPost });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const likePost = async (req, res, next) => {
  const { postId, userId } = req.body;
  try {
    const likedPost = await postModel.findById(postId).populate("creatorId");
    const isPostUnliked = likedPost.likes.find((user_Id) =>
      user_Id.equals(userId)
    )
      ? true
      : false;
    if (isPostUnliked) {
      const updatedLikesArr = likedPost.likes.filter(
        (user_Id) => !user_Id.equals(userId)
      );
      likedPost.likes = updatedLikesArr;
    } else {
      likedPost.likes.push(userId);
    }
    await likedPost.save();
    res.json({ likedPost: likedPost });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const addComment = async (req, res, next) => {
  const { userId, comment, postId } = req.body;
  try {
    const post = await postModel.findById(postId).populate("creatorId");
    const newCommentObj = { userId, comment };
    post.comments.push(newCommentObj);
    await post.save();
    res.json({ updatedPost: post });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  const { commentId, postId } = req.body;
  try {
    const post = await postModel.findById(postId).populate("creatorId");
    const updatedCommentsArr = post.comments.filter(
      (comm) => !comm._id.equals(commentId)
    );
    post.comments = updatedCommentsArr;
    await post.save();
    res.json({ updatedPost: post });
  } catch (err) {
    next(err);
  }
};

export const getAllPosts = async (req, res, next) => {
  const currentUserId = req.userId;
  try {
    const currentUser = await userModel.findById(currentUserId);
    const allPosts = await postModel.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "creatorId",
          foreignField: "_id",
          as: "creatorId",
        },
      },
    ]);

    const filteredPosts = allPosts.map((post) => {
      const creatorObj = post.creatorId[0];
      post.creatorId = creatorObj;
      return post;
    });

    const finalPostsArr = filteredPosts.filter((post) => {
      if (
        !post.creatorId.isPrivate ||
        post.creatorId.followers.find((follower) =>
          follower.equals(currentUser._id)
        ) ||
        post.creatorId._id.equals(currentUserId)
      ) {
        return post;
      }
    });

    res.json({ allPosts: finalPostsArr });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const postToDelete = await postModel.findByIdAndRemove(postId);
    const creator = await userModel.findByIdAndUpdate(postToDelete.creatorId, {
      $pull: {
        posts: postToDelete._id,
      },
    });
    const updatedCreator = await userModel
      .findById(creator._id)
      .populate("posts");

    if (process.env.NODE_ENV === "production") {
      await cloudinary.v2.api.delete_resources([postToDelete.postImgId]);
    } else {
      deleteFile(postToDelete.postImg);
    }

    res.json({ updatedPosts: updatedCreator.posts });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const editPost = async (req, res, next) => {
  const { postId } = req.params;
  const { newCaption, editedTags } = req.body;
  try {
    const postToEdit = await postModel.findById(postId);
    postToEdit.caption = newCaption;
    postToEdit.tags = editedTags;
    await postToEdit.save();
    res.json({ updatedPost: postToEdit });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
