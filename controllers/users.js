import userModel from "../models/User.js";
import postModel from "../models/Post.js";
import { deleteFile } from "../utils/deleteFile.js";

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
    const result = await userModel.aggregate([
      { $match: { username: username } },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "creatorId",
          as: "posts",
        },
      },
      {
        $set: {
          posts: {
            $sortArray: {
              input: "$posts",
              sortBy: {
                createdAt: -1,
              },
            },
          },
        },
      },
    ]);
    const specificUser = result[0];
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

export const getTaggedPosts = async (req, res, next) => {
  const { username } = req.params;
  try {
    const specificUser = await userModel
      .findOne({ username })
      .populate("posts");
    if (!specificUser) {
      const err = new Error("This user doesn't exist");
      err.statusCode = 404;
      throw err;
    } else {
      const taggedPosts = await postModel
        .find({
          "tags.username": specificUser.username,
        })
        .sort({ createdAt: -1 })
        .populate("creatorId");
      res.json({ taggedPosts: taggedPosts });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  const { username } = req.body;
  const imgFile = req.file;
  let imgPath;
  if (imgFile) {
    imgPath = `${process.env.API_URL}${imgFile.path}`;
  }
  try {
    const currentUser = await userModel.findById(req.userId);
    if (currentUser.username !== username) {
      const existingUser = await userModel.findOne({ username: username });
      if (existingUser) {
        const err = new Error("Username is not available");
        err.statusCode = 403;
        throw err;
      }
    }
    if (imgPath) {
      if (currentUser.profilePic) {
        deleteFile(currentUser.profilePic);
      }
      currentUser.profilePic = imgPath;
    }
    currentUser.username = username;
    await currentUser.save();

    res.json({ updatedUser: currentUser });
  } catch (err) {
    next(err);
  }
};

export const followUser = async (req, res, next) => {
  const { currentUserId, userToFollowId } = req.body;
  try {
    const userToFollow = await userModel.findById(userToFollowId);
    const currentUser = await userModel.findById(currentUserId);

    if (
      userToFollow.followers.find((followerId) =>
        followerId.equals(currentUserId)
      )
    ) {
      const updatedFollowersArr = userToFollow.followers.filter(
        (followerId) => !followerId.equals(currentUserId)
      );
      userToFollow.followers = updatedFollowersArr;
      const updatedFollowingArr = currentUser.following.filter(
        (followingId) => !followingId.equals(userToFollowId)
      );
      currentUser.following = updatedFollowingArr;
    } else {
      userToFollow.followers.push(currentUserId);
      currentUser.following.push(userToFollowId);
    }
    await userToFollow.save();
    await currentUser.save();

    res.json({ updatedUser: currentUser });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getPeople = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const { following, followers } = await userModel
      .findById(userId)
      .populate("followers")
      .populate("following");
    res.json({ people: { followers, following } });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const updateUserSearchHistory = async (req, res, next) => {
  const { userId, actionType } = req.body;
  const currentUser = await userModel.findById(req.userId);
  try {
    if (actionType === "remove") {
      await userModel.findByIdAndUpdate(req.userId, {
        $pull: { searchHistory: userId },
      });
    } else if (actionType === "removeAll") {
      currentUser.searchHistory = [];
      await currentUser.save();
    } else {
      const hasAlreadySearched = currentUser.searchHistory.find(
        (searchedUserId) => searchedUserId.equals(userId)
      );
      if (hasAlreadySearched) {
        await userModel.findByIdAndUpdate(req.userId, {
          $pull: { searchHistory: userId },
        });
      }
      const updatedUser = await userModel.findById(req.userId);
      updatedUser.searchHistory.push(userId);
      await updatedUser.save();
    }
    const updatedCurrentUser = await userModel
      .findById(req.userId)
      .populate("searchHistory");
    res.json({ updatedHistory: updatedCurrentUser.searchHistory });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
