import userModel from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";

export const signupUser = async (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorsArr = errors.array().map((err) => {
      return { field: err.path, message: err.msg };
    });
    res.status(401).json({ errors: errorsArr });
  } else {
    try {
      const emailExists = (await userModel.findOne({ email: email }))
        ? true
        : false;
      const usernameExists = (await userModel.findOne({ username: username }))
        ? true
        : false;
      if (emailExists) {
        res.status(403).json({
          errors: [
            { field: "email", message: "This email is already registered" },
          ],
        });
      } else if (usernameExists) {
        res.status(403).json({
          errors: { field: "username", message: "This username is taken" },
        });
      } else {
        const encryptedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
          email,
          password: encryptedPassword,
          username,
        });
        await newUser.save();
        res.status(201).json({ user: newUser });
      }
    } catch (err) {
      next(err);
    }
  }
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email: email });
    if (user) {
      const isValidUser = await bcrypt.compare(password, user.password);
      if (isValidUser) {
        const token = jsonwebtoken.sign(
          { userId: user._id },
          process.env.JWT_TOKEN_SECRET,
          {
            expiresIn: "10d",
          }
        );
        if (token) {
          res.status(200).cookie("jwt", token, {
            maxAge: 10 * 24 * 60 * 60 * 1000,
            httpOnly: true,
          });
          res.status(200).json({ user: user });
        }
      } else {
        res.status(401).json({
          errors: [{ field: "password", message: "Incorrect password" }],
        });
      }
    } else {
      res
        .status(401)
        .json({ errors: [{ field: "email", message: "Incorrect email" }] });
    }
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res, next) => {
  res.clearCookie("jwt");
  res.json({ message: "cookie removed" });
};

export const resetPasswordRequest = (req, res, next) => {
  res.json({ message: "changed password" });
};
