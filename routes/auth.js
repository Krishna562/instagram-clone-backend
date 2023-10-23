import { Router } from "express";
import { body } from "express-validator";

import {
  loginUser,
  resetPasswordRequest,
  signupUser,
} from "../controllers/auth.js";

const authRouter = Router();

authRouter.put(
  "/signup",
  body("email", "Invalid Email").isEmail().notEmpty(),
  body("password", "Invalid password")
    .isLength({ min: 4 })
    .withMessage("Password must be atleast 4 characters long")
    .notEmpty(),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("The passwords do not match");
    } else {
      return true;
    }
  }),
  signupUser
);
authRouter.put("/login", loginUser);
authRouter.post("/resetPasswordRequest", resetPasswordRequest);

export default authRouter;
