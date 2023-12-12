import jsonwebtoken from "jsonwebtoken";
import userModel from "../models/User.js";

const isValidUser = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    res.status(401).json({ error: "Token not recieved" });
  } else {
    try {
      const decodedToken = jsonwebtoken.verify(
        token,
        process.env.JWT_TOKEN_SECRET
      );
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
};

export default isValidUser;
