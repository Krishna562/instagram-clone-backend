import postModel from "../models/Post.js";
import userModel from "../models/User.js";

export const createPost = async (req, res, next) => {
  const imgFile = req.file;
  const { caption } = req.body;
  const imgUrl = `http://localhost:3000/${imgFile.path}`;
  try {
    const newPost = new postModel({
      creatorId: req.userId,
      caption: caption,
      postImg: imgUrl,
    });
    await newPost.save();
    const user = await userModel.findById(req.userId);
    user.posts.push(newPost);
    user.save();
    res.json({ newPost: newPost });
  } catch (err) {
    next(err);
  }
};

export const likePost = async (req, res, next) => {
  const { postId, userId } = req.body;
  try {
    const likedPost = await postModel.findById(postId);
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
