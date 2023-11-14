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

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://instagram-clone-frontend-kx2l.onrender.com",
      "https://instagram-clone-frontend-562.vercel.app",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorizations"],
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
  const status = error.statusCode || 500;
  res.status(status).json({
    error: error.message,
  });
});

mongoose.connect(`${process.env.MONGODB_URI}`).then(() => {
  app.listen(3000);
});
