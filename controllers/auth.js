import userModel from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import verificationModel from "../models/Verification.js";

// NODEMAILER TRANSPORTER

const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: "robin2007562@outlook.com",
    pass: "krishna_@5621",
  },
});

export const signupUser = async (req, res, next) => {
  const { username, email, password } = req.body;
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
          errors: [{ field: "username", message: "This username is taken" }],
        });
      } else {
        const frontendUrl =
          process.env.NODE_ENV === "production"
            ? process.env.ONRENDER_FRONTEND_URL
            : process.env.FRONTEND_URL;

        crypto.randomBytes(10, async (err, buffer) => {
          if (err) {
            console.log(err);
            throw err;
          } else {
            const token = buffer.toString("hex");
            const mailOptions = {
              from: "robin2007562@outlook.com",
              to: email,
              subject: "Email verification",
              html: `<h1>Email verification</h1>
                  <p>Click on this <a href='${frontendUrl}/request-sent/emailVerified?token=${token}'>link</a> to verify your email (${email}) 
                  </p>`,
            };

            transporter.sendMail(mailOptions, (err, info) => {
              if (err) {
                console.log(err);
                throw err;
              }
            });

            const encryptedPassword = await bcrypt.hash(password, 10);
            const userToVerify = new verificationModel({
              username: username,
              email: email,
              password: encryptedPassword,
              token: token,
            });

            await userToVerify.save();
          }
        });

        res.json({ message: "Signup email verification link sent" });
      }
    } catch (err) {
      next(err);
    }
  }
};

export const verifyEmail = async (req, res, next) => {
  const token = req.params.token;
  try {
    const verificationUser = await verificationModel.findOne({
      token: token,
    });

    if (!verificationUser) {
      const err = new Error("Invalid token");
      err.statusCode = 401;
      throw err;
    }

    const { password, email, username } = verificationUser;

    const newUser = new userModel({
      email,
      password: password,
      username,
    });
    await newUser.save();

    // DELETE THE USER IN VERIFICATION COLLECTION AFTER HE HAS BEEN VERIFIED

    await verificationModel.findOneAndDelete({ token: token });

    res.status(200).json({ message: "user is verified" });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await userModel
      .findOne({ email: email })
      .populate("searchHistory");
    if (user) {
      const isValidUser = await bcrypt.compare(password, user.password);
      if (isValidUser) {
        const token = jsonwebtoken.sign(
          { userId: user._id },
          process.env.JWT_TOKEN_SECRET,
          {
            expiresIn: "3",
          }
        );
        if (token) {
          res.status(200).cookie("jwt", token, {
            maxAge: 3 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
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
  res.clearCookie("jwt", {
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
  });
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

      const frontendUrl =
        process.env.NODE_ENV === "production"
          ? process.env.ONRENDER_FRONTEND_URL
          : process.env.FRONTEND_URL;

      // SENDING THE EMAIL
      const emailOptions = {
        from: "robin2007562@outlook.com",
        to: email,
        subject: "password reset request",
        html: `<h1>Password reset request</h1><p>You requested for a password reset. Click the <a href='${frontendUrl}/reset-password/${token}'>link</a> to change your password.`,
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
