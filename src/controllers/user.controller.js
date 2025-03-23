import { asynchandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/apiError.js";
import { Apiresponse } from "../utils/apiResponce.js";
import validator from "validator";
import { user } from "../models/user.model.js";
import { follow } from "../models/follow.model.js";
import { Post } from "../models/post.model.js";
import { deleteInCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Like } from "../models/like.model.js";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const Currentuser = await user.findById(userId);
    if (!user) {
      throw new Apierror(401, "user not found in Access Token");
    }
    const AccessToken = await Currentuser.generateAccessToken();

    const RefreshToken = await Currentuser.generateRefreshToken();

    Currentuser.refreshToken = RefreshToken;
    await Currentuser.save({ validateBeforeSave: false });
    // console.log(AccessToken);

    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new Apierror(
      500,
      "some thing went wrong while genarating refresh and access token"
    );
  }
};

const registerUser = asynchandler(async (req, res, next) => {
  try {
    const {
      userName,
      email,
      password,
      fullName,
      gender,
      discription,
      Location,
    } = req.body;
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new Apierror(404, "avatar not found");
    }
    const alldetails = [
      { userName: userName },
      { email: email },
      { password: password },
      { fullName: fullName },
      { gender: gender },
      { discription: discription },
      { Location: Location },
    ];

    // if {user:username} then object.entries() is use to conver {} to []
    alldetails.map((obj, i) => {
      const [key, value] = Object.entries(obj)[0]; // it give array in side array so i use [0]
      if (!value) {
        // console.log(i, "index");
        throw new Apierror(404, `${key} not found `);
      }
    });

    const isValidEmail = validator.isEmail(email);
    const isValidUserName = validator.isAlphanumeric(userName);

    if (!isValidUserName) throw new Apierror(401, "userName is not vaild");
    if (!isValidEmail) throw new Apierror(401, "email is not vaild");

    const existUser = await user.findOne({
      $or: [{ userName }, { email }],
    });

    if (existUser) throw new Apierror(401, "user or email allready exists");
    // console.log(avatarLocalPath, "avatar");

    const uploadAvatar = await uploadOnCloudinary(avatarLocalPath); //url there is also colled secure url

    if (!uploadAvatar) throw new Apierror(401, "avatar is not uploded");

    const concatAvatar = uploadAvatar?.url + "%" + uploadAvatar?.public_id;
    // console.log(concatAvatar);

    const User = await user.create({
      fullName,
      userName,
      avatar: concatAvatar,
      password,
      email,
      gender,
      discription,
      Location,
    });

    const createdUser = await user
      .findById(User._id)
      .select("-password -refreshToken");

    if (!createdUser) {
      throw new Apierror(500, "something went wrong while registring user");
    }

    return res
      .status(200)
      .json(new Apiresponse(200, createdUser, "usercreate successfully"));
  } catch (error) {
    next(error);
  }
});

const login = asynchandler(async (req, res, next) => {
  try {
    const { userName, email, password } = req.body;
    // console.log(password);

    if (!(userName || email)) {
      throw new Apierror(402, "username or email is requierd");
    }
    if (!password) {
      throw new Apierror(402, "password is requierd");
    }

    const currentUser = await user.findOne({
      $or: [{ userName }, { email }],
    });
    // console.log(currentUser);

    if (!currentUser) throw new Apierror(403, "user not found pleace register");

    const userPassword = await currentUser.isPasswordCorrect(password);
    // console.log(userPassword, "password");

    if (!userPassword) {
      throw new Apierror(402, "password is incorrect");
    }

    const { AccessToken, RefreshToken } = await generateAccessAndRefreshToken(
      currentUser._id
    );
    // console.log(AccessToken);

    const finalLoginUser = await user
      .findById(currentUser._id)
      .select("-password -refreshToken");

    const options = {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    };
    return res
      .status(200)
      .cookie("accessToken", AccessToken, options)
      .cookie("refreshToken", RefreshToken, options)
      .json(
        new Apiresponse(
          200,
          {
            user: finalLoginUser,
            AccessToken,
            RefreshToken,
          },
          "user login successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

const logout = asynchandler(async (req, res, next) => {
  try {
    // console.log(req.user._id, "user");

    await user.findOneAndUpdate(
      req.user?._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
    const options = {
      httpOnly: true,
      secure: false,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new Apiresponse(200, "user logout successfully"));
  } catch (error) {
    next(error);
  }
});

const currentUser = asynchandler(async (req, res, next) => {
  try {
    const curruser = await user
      .findOne({ _id: req.user?._id })
      .select("-password -refreshToken");
    if (!curruser) {
      throw new Apierror(404, "can't find the user");
    }

    return res
      .status(200)
      .json(new Apiresponse(200, curruser, "user fetch successfully"));
  } catch (error) {
    next(error);
  }
});

const changePassword = asynchandler(async (req, res, next) => {
  try {
    const { password, newpassword } = req.body;
    // console.log(password);

    // console.log(await req.user?._id);

    const Currentuser = await user.findById(req.user?._id);
    if (!Currentuser) {
      throw new Apierror(401, "user not found");
    }
    const isCorrectPass = await Currentuser.isPasswordCorrect(password);
    if (!isCorrectPass) {
      throw new Apierror(401, "wrong password");
    }
    Currentuser.password = newpassword;
    await Currentuser.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new Apiresponse(200, "password change success fully"));
  } catch (error) {
    next(error);
  }
});

const changeAvatar = asynchandler(async (req, res, next) => {
  try {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new Apierror(401, "local file path notfound");

    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
    if (!uploadedAvatar) throw new Apierror(401, "avatar is not upload");

    const currentUser = await user.findOne(req.user?._id);
    if (!currentUser) throw new Apierror(401, "user is not found in upload");

    const public_id = currentUser?.avatar;
    // console.log(public_id, "ppppppppppppppppp");

    const cloudPath_publicId = public_id.split("%")[1];
    // console.log(cloudPath_publicId, "iddddddddddddddddd");

    const deleteOldAvatar = await deleteInCloudinary(cloudPath_publicId);
    if (!deleteOldAvatar) throw new Apierror(401, "avatar is not delete");

    await user.findOneAndUpdate(currentUser, {
      $set: {
        avatar: uploadedAvatar?.url + "%" + uploadedAvatar?.public_id,
      },
    });

    return res
      .status(200)
      .json(
        new Apiresponse(200, uploadedAvatar, "profile change successfully")
      );
  } catch (e) {
    next(e);
  }
});

const createFollowerPipline = asynchandler(async (req, res, next) => {
  try {
    const { whomtofollow } = req.body;
    if (!whomtofollow) {
      throw new Apierror(401, "messing whomtofollow");
    }

    const currentUser = await user.findById({ _id: req.user?._id });
    if (!currentUser) {
      throw new Apierror(401, "messing currentUser ");
    }
    const whomtofollowObjectId = await user.findOne({ userName: whomtofollow });
    if (!currentUser) {
      throw new Apierror(401, "messing whomtofollowObjectId ");
    }

    const pipline = await follow.create({
      whoFollow: currentUser,
      whomToFollow: whomtofollowObjectId,
    });

    return res
      .status(200)
      .json(new Apiresponse(200, pipline, "pipline created successfully"));
  } catch (error) {
    next(error);
  }
});

const createUnFollowerPipline = asynchandler(async (req, res, next) => {
  try {
    const { unfollowId } = req.body;
    if (!unfollowId) {
      throw new Apierror(401, "can't find the id to unfollow");
    }
    const unfollow = await follow.findOneAndDelete({
      whoFollow: req.user?._id,
      whomToFollow: unfollowId,
    });
    if (!unfollow) {
      throw new Apierror(401, "can't unfollow");
    }

    return res
      .status(200)
      .json(new Apiresponse(200, unfollow, "unfollow successfully"));
  } catch (error) {
    next(error);
  }
});

const getFollowers = asynchandler(async (req, res, next) => {
  try {
    const { userName } = req.params;
    // console.log(req.params);

    // console.log(userName);

    if (!userName?.trim()) throw new Apierror(400, "user name is missing");
    const follower = await user.aggregate([
      {
        $match: {
          userName: userName?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "whomToFollow",
          as: "myfollower",
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "whoFollow",
          as: "myfollowing",
        },
      },
      {
        $addFields: {
          followerCount: {
            $size: "$myfollower",
          },
          followeingCount: {
            $size: "$myfollowing",
          },
          isfollow: {
            $cond: {
              if: { $in: [req.user?._id, "$myfollower.whoFollow"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          followerCount: 1,
          followeingCount: 1,
          isfollow: 1,
          email: 1,
          userName: 1,
          avatar: 1,
          discription: 1,
          Location: 1,
          fullName: 1,
        },
      },
    ]);

    if (!follower?.length) {
      throw new Apierror(404, "channel does not exist");
    }

    return res
      .status(200)
      .json(new Apiresponse(200, follower, "follower fetch successfully"));
  } catch (error) {
    next(error);
  }
});

const whoFollow = asynchandler(async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Apierror(404, "user not found");
    }
    const followpackages = await follow
      .find({
        whomToFollow: req.user?._id,
      })
      .populate({ path: "whoFollow", select: "-password -refreshToken" });

    if (!followpackages) {
      throw new Apierror(405, "don't have follower");
    }
    const finalfollower = followpackages.map((whoFollow) => whoFollow);
    return res
      .status(200)
      .json(
        new Apiresponse(200, finalfollower, "follower fetched successfully")
      );
  } catch (error) {
    next(error);
  }
});
const Following = asynchandler(async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Apierror(404, "user not found");
    }
    const followingpackages = await follow
      .find({
        whoFollow: req.user?._id,
      })
      .populate({ path: "whomToFollow", select: "-password -refreshToken" });
    if (!followingpackages) {
      throw new Apierror(405, "don't have following");
    }

    const finalFollowing = followingpackages.map(
      ({ whomToFollow }) => whomToFollow
    );
    return res
      .status(200)
      .json(
        new Apiresponse(200, finalFollowing, "following fetched successfully")
      );
  } catch (error) {
    next(error);
  }
});

// const likePost = asynchandler(async (req, res, next) => {
//   try {
//     const { postId } = req.body;
//     if (!postId) throw new Apierror(401, "postId not found");
//     const post = await Post.findById({ _id: postId });
//     if (!post) throw new Apierror(401, "post data not found");
//     const me = await user.findById({ _id: req.user?._id });
//     if (!me) {
//       throw new Apierror(404, "user not found");
//     }
//     if (
//       me.likePost.some((e) => e.equals(new mongoose.Types.ObjectId(postId)))
//     ) {
//       const currentUser = await user.updateOne(
//         { _id: req.user?._id },
//         {
//           $pull: {
//             likePost: post?._id,
//           },
//         }
//       );
//       if (!currentUser) {
//         throw new Apierror(401, "user not updated");
//       }
//       const currentPost = await Post.updateOne(
//         { _id: post?._id },
//         {
//           $pull: {
//             whoLike: me?._id,
//           },
//           $inc: {
//             likeCount: -1,
//           },
//         }
//       );
//       if (!currentPost) {
//         throw new Apierror(401, "post not updated");
//       }
//       return res.status(200).json(new Apiresponse(200, "unliked"));
//     }

//     const currentUser = await user.updateOne(
//       { _id: req.user?._id },
//       {
//         $push: {
//           likePost: post?._id,
//         },
//       }
//     );
//     if (!currentUser) {
//       throw new Apierror(401, "user not updated");
//     }
//     post.whoLike.push(me?._id);
//     post.likeCount = post.whoLike.length;

//     await post.save({ validateBeforeSave: false });
//     await me.save({ validateBeforeSave: false });

//     return res.status(200).json(new Apiresponse(200, "liked"));
//   } catch (error) {
//     console.log(error);

//     next(error);
//   }
// });

const showpost = asynchandler(async (req, res, next) => {
  try {
    const { postName } = req.body;
    if (!postName) throw new Apierror(401, "postName not found");
    const post = await Post.findOne({ title: postName }).populate({
      path: "creater",
      select: "-password -refreshToken",
    });
    if (!post) {
      throw new Apierror(401, "post not found");
    }

    return res
      .status(200)
      .json(new Apiresponse(200, post, "post fetched successfully"));
  } catch (error) {
    next(error);
  }
});

const likeHistory = asynchandler(async (req, res, next) => {
  try {
    const me = await user
      .findById({ _id: req.user?._id })
      .select("-password -refreshToken")
      .populate({ path: "likePost" });
    if (!me) {
      throw new Apierror(404, "user not found");
    }
    return res
      .status(200)
      .json(new Apiresponse(200, me, "All post fetched successfully"));
  } catch (error) {
    next(error);
  }
});

const allProfile = asynchandler(async (req, res, next) => {
  try {
    const joinedData = await user.aggregate([
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "whoFollow",
          as: "followData",
        },
      },
      {
        $project: {
          _id: 1,
          userName: 1,
          avatar: 1,
          discription: 1,
          Location: 1,
          "followData.whomToFollow": 1,
        },
      },
    ]);

    if (!joinedData) {
      throw new Apierror(401, "can't fetch profile");
    }

    return res
      .status(200)
      .json(new Apiresponse(200, joinedData, "user fetched successfully"));
  } catch (error) {
    next(error);
  }
});

const allPost = asynchandler(async (req, res, next) => {
  try {
    const posts = await Post.find().populate({
      path: "creater",
      select: "-password -refreshToken",
    });
    if (!posts) {
      throw new Apierror(401, "can't fetch post");
    }

    return res
      .status(200)
      .json(new Apiresponse(200, "post fetched successfully"));
  } catch (error) {
    next(error);
  }
});
const likePost = asynchandler(async (req, res, next) => {
  try {
    const { postId } = req.body;
    if (!postId) throw new Apierror(401, "post id not found");

    const findpost = await Post.findById({ _id: postId });

    if (!findpost) throw new Apierror(402, "post  not found");
    console.log(findpost);

    const findlikeModel = await Like.findOne({
      post: findpost?._id,
      user: req.user?._id,
    });
    if (findlikeModel) {
      await Like.deleteOne({ findlikeModel });
      return res.status(200).json(new Apiresponse(200, "unLike successfully"));
    }
    const Liked = await Like.create({
      post: postId,
      user: req.user?._id,
    });

    if (!Liked) throw new Apierror(401, "Like is not done");

    const likeCounts = await Like.countDocuments({
      post: postId,
    });
    findpost.likeCount = likeCounts;

    await findpost.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new Apiresponse(200, Liked, "Liked successFully"));
  } catch (error) {
    next(error);
  }
});

const UsersPost = asynchandler(
  asynchandler(async (req, res, next) => {
    try {
      const { userId } = req.body;
      if (!userId) throw new Apierror(401, "userId not found");

      const userPostData = await Post.find({ creater: userId });
      if (!userPostData) throw new Apierror(401, "userPostData not found");

      return res
        .status(200)
        .json(new Apiresponse(200, userPostData, "data fetched successfully"));
    } catch (error) {
      next();
    }
  })
);

const followingLike = asynchandler(async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Apierror(404, "user not found");
    }
    const followings = await follow
      .find({
        whoFollow: req.user?._id,
      })
      .populate({ path: "whomToFollow", select: "-password -refreshToken" });

    const postData = await Like.aggregate([{}]);

    return res
      .status(200)
      .json(new Apiresponse(200, postData, "got the following"));
  } catch (error) {
    next(error);
  }
});
export {
  registerUser,
  login,
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
  followingLike,
  UsersPost,
};
