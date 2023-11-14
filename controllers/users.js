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
    const currentUser = await userModel
      .findById(req.userId)
      .populate("searchHistory");
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
    const currentUser = await userModel
      .findById(currentUserId)
      .populate("searchHistory");

    if (
      userToFollow.followers.find((followerId) =>
        followerId.equals(currentUserId)
      )
    ) {
      // UNFOLLOW
      const updatedFollowersArr = userToFollow.followers.filter(
        (followerId) => !followerId.equals(currentUserId)
      );
      userToFollow.followers = updatedFollowersArr;
      const updatedFollowingArr = currentUser.following.filter(
        (followingId) => !followingId.equals(userToFollowId)
      );
      currentUser.following = updatedFollowingArr;
    } else if (
      userToFollow.isPrivate &&
      !userToFollow.followRequestsRecieved.find((requestRecieved) =>
        requestRecieved.equals(currentUserId)
      )
    ) {
      // REQUEST TO FOLLOW
      userToFollow.followRequestsRecieved.push(currentUserId);
      currentUser.followRequestsSent.push(userToFollowId);
    } else if (
      userToFollow.followRequestsRecieved.find((requestRecieved) =>
        requestRecieved.equals(currentUserId)
      )
    ) {
      // CANCEL THE REQUEST TO FOLLOW
      const updatedRequestsRecievedArr =
        userToFollow.followRequestsRecieved.filter(
          (requestRecieved) => !requestRecieved.equals(currentUserId)
        );
      userToFollow.followRequestsRecieved = updatedRequestsRecievedArr;

      const updatedRequestsSentArr = currentUser.followRequestsSent.filter(
        (requestSent) => !requestSent.equals(userToFollowId)
      );
      currentUser.followRequestsSent = updatedRequestsSentArr;
    } else {
      // FOLLOW ( AS THE USER TO FOLLOW HAS A PUBLIC ACCOUNT )
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

export const handleFollowRequest = async (req, res, next) => {
  const { currentUserId, followRequesterId, actionType } = req.body;
  try {
    const currentUser = await userModel
      .findById(currentUserId)
      .populate("searchHistory");
    const followRequester = await userModel.findById(followRequesterId);

    // UPDATE THE REQUESTER
    const updatedRequestsSentArr = followRequester.followRequestsSent.filter(
      (reqestSent) => !reqestSent.equals(currentUserId)
    );
    followRequester.followRequestsSent = updatedRequestsSentArr;

    // UPDATE THE CURRENT USER
    const updatedRequestsRecievedArr =
      currentUser.followRequestsRecieved.filter(
        (requestRecieved) => !requestRecieved.equals(followRequesterId)
      );
    currentUser.followRequestsRecieved = updatedRequestsRecievedArr;

    if (actionType === "accept") {
      currentUser.followers.push(followRequesterId);
      followRequester.following.push(currentUserId);
    }

    await currentUser.save();
    await followRequester.save();

    res.json({ updatedCurrentUser: currentUser });
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

export const toggleAccountVisibility = async (req, res, next) => {
  const { _id, followRequestsRecieved } = req.body.currentUser;
  try {
    const currentUser = await userModel.findById(_id).populate("searchHistory");

    if (currentUser.isPrivate) {
      await userModel.updateMany(
        { followRequestsSent: currentUser._id },
        {
          $push: { following: currentUser._id },
          $pull: { followRequestsSent: currentUser._id },
        }
      );
      currentUser.followers = [
        ...currentUser.followers,
        ...followRequestsRecieved,
      ];
      currentUser.followRequestsRecieved = [];
      currentUser.isPrivate = false;
    } else {
      currentUser.isPrivate = true;
    }
    await currentUser.save();
    res.json({ updatedUser: currentUser });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
