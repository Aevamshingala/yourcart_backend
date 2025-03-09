import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  login,
  registerUser,
  logout,
  changePassword,
  changeAvatar,
  getFollowers,
  createFollowerPipline,
  whoFollow,
  Following,
  likePost,
  showpost,
  likeHistory,
  allProfile,
  createUnFollowerPipline,
  currentUser,
  allPost,
  findUser,
} from "../controllers/user.controller.js";
import { createPost } from "../controllers/post.controller.js";

import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router = Router();
router.route("/register").post(upload.single("avatar"), registerUser);
router.route("/login").post(login);
router.route("/logout").post(verifyJwt, logout);
router.route("/password").post(verifyJwt, changePassword);
router
  .route("/avatarchange")
  .post(verifyJwt, upload.single("avatar"), changeAvatar);
router.route("/follower:userName").get(verifyJwt, getFollowers);
router.route("/pipline").post(verifyJwt, createFollowerPipline);
router.route("/myfollower").post(verifyJwt, whoFollow);
router.route("/myfollowing").post(verifyJwt, Following);
router.route("/likePost").post(verifyJwt, likePost);
router.route("/createpost").post(verifyJwt, createPost);
router.route("/showpost").post(verifyJwt, showpost);
router.route("/likeHistory").post(verifyJwt, likeHistory);
router.route("/allprofile").post(verifyJwt, allProfile);
router.route("/unfollow").post(verifyJwt, createUnFollowerPipline);
router.route("/myprofile").post(verifyJwt, currentUser);
router.route("/allpost").post(verifyJwt, allPost);
router.route("/finduser").post(verifyJwt, findUser);

export { router as userrouter };