// ENVIRONMENT VARIABLES INITIALIZATION
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import multer from "multer";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import loggedInRouter from "./routes/isLoggedIn.js";
import postsRouter from "./routes/posts.js";

import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.ONRENDER_FRONTEND_URL],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/images", express.static(path.join(path.resolve(), "images")));

app.use(express.json());

app.use(cookieParser());

// MULTER SETUP

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("imgFile")
);

app.use(authRouter);

app.use(loggedInRouter);

app.use(usersRouter);

app.use(postsRouter);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  res.status(status).json({
    error: error.message,
  });
});

mongoose.connect(`${process.env.MONGODB_URI}`).then(() => {
  app.listen(3000);
});
