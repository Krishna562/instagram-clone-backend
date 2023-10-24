import userModel from "../models/User.js";
import postModel from "../models/Post.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await userModel.find();
    res.status(200).json({ allUsers: allUsers });
  } catch (err) {
    next(err);
  }
};

export const getSpecificUser = async (req, res, next) => {
  const { username } = req.params;

  try {
    const specificUser = await userModel
      .findOne({ username: username })
      .populate("posts");
    if (!specificUser) {
      const err = new Error("This user doesn't exist");
      err.statusCode = 404;
      throw err;
    } else {
      res.json({ specificUser: specificUser, userPosts: specificUser.posts });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getSpecificUserById = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const specificUser = await userModel.findById(userId).populate("posts");
    if (!specificUser) {
      const err = new Error("This user doesn't exist");
      err.statusCode = 404;
      throw err;
    } else {
      res.json({ specificUser: specificUser });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};
