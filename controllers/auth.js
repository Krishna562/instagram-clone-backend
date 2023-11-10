import userModel from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

// NODEMAILER TRANSPORTER

const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: "robin2007562@outlook.com",
    pass: "krishna_@5621",
  },
});

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
      res.status(401).json({
        errors: [{ field: "email", message: "This email is not registered" }],
      });
    }
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res, next) => {
  res.clearCookie("jwt");
  res.json({ message: "cookie removed" });
};

export const sendResetPasswordEmail = (req, res, next) => {
  const email = req.body.email;

  // GET A RANDOM TOKEN
  crypto.randomBytes(10, async (err, buffer) => {
    if (err) {
      console.log(err);
      next(err);
    } else {
      const token = buffer.toString("hex");
      try {
        const user = await userModel.findOne({ email: email });
        if (!user) {
          res.status(401).json({
            errors: [
              { field: "email", message: "This email is not registered" },
            ],
          });
        } else {
          user.passwordResetToken = token;
          user.passwordExpiration = Date.now() + 36000000;
          await user.save();
        }
      } catch (err) {
        next(err);
      }

      // SENDING THE EMAIL
      const emailOptions = {
        from: "robin2007562@outlook.com",
        to: email,
        subject: "password reset request",
        html: `<h1>Password reset request</h1><p>You requested for a password reset. Click the <a href='${
          process.env.ONRENDER_FRONTEND_URL || process.env.FRONTEND_URL
        }/reset-password/${token}'>link</a> to change your password.`,
      };

      transporter.sendMail(emailOptions, (err, data) => {
        if (err) {
          console.log(err);
          next(err);
        } else {
          res.json({ message: "email sent successfully" });
        }
      });
    }
  });
};

export const resetPassword = async (req, res, next) => {
  const { newPassword, resetToken } = req.body;
  try {
    const user = await userModel.findOne({
      passwordResetToken: resetToken,
      passwordExpiration: { $gt: Date.now() },
    });
    if (!user) {
      const err = new Error("The reset token is invalid or expired");
      err.statusCode = 401;
      throw err;
    } else {
      const newEncPassword = await bcrypt.hash(newPassword, 10);
      user.password = newEncPassword;
      user.passwordResetToken = "";
      await user.save();
      res.json({ message: "Password changed successfully !" });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};
