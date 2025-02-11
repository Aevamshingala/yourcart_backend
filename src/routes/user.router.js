import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  login,
  registerUser,
  logout,
  changePassword,
  changeAvatar,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router = Router();
router.route("/register").post(upload.single("avatar"), registerUser);
router.route("/login").post(login);
router.route("/logout").post(verifyJwt, logout);
router.route("/password").post(verifyJwt, changePassword);
router
  .route("/avatarchange")
  .post(verifyJwt, upload.single("avatar"), changeAvatar);

export { router as userrouter };