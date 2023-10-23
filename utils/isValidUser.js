import jsonwebtoken from "jsonwebtoken";
import userModel from "../models/User.js";

const isValidUser = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    res.status(401).json({ error: "Token not recieved" });
  } else {
    const decodedToken = jsonwebtoken.verify(token, "instagramCloneButBetter");
    if (!decodedToken) {
      res.status(401).json({ error: "Token is invalid" });
    } else {
      try {
        const userId = decodedToken.userId;
        const user = await userModel.findById(userId);
        if (!user) {
          const err = new Error("The user doesn't exist");
          err.statusCode = 401;
          throw err;
        } else {
          req.userId = userId;
          next();
        }
      } catch (err) {
        next(err);
      }
    }
  }
};

export default isValidUser;
