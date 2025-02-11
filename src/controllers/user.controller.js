import { asynchandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/apiError.js";
import { Apiresponce } from "../utils/apiResponce.js";
import validator from "validator";
import { user } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
    console.log(AccessToken);

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
    const { userName, email, password, fullName, gender } = req.body;
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
    ];

    // if {user:username} then object.entries() is use to conver {} to []
    alldetails.map((obj, i) => {
      const [key, value] = Object.entries(obj)[0]; // it give array in side array so i use [0]
      if (!value) {
        console.log(i, "index");
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
    console.log(avatarLocalPath, "avatar");

    const uploadAvatar = await uploadOnCloudinary(avatarLocalPath); //url there is also colled secure url

    if (!uploadAvatar) throw new Apierror(401, "avatar is not uploded");

    const User = await user.create({
      fullName,
      userName,
      avatar: uploadAvatar?.url,
      password,
      email,
      gender,
    });

    const createdUser = await user
      .findById(User._id)
      .select("-password -refreshToken");

    if (!createdUser) {
      throw new Apierror(500, "something went wrong while registring user");
    }

    return res
      .status(200)
      .json(new Apiresponce(200, createdUser, "usercreate successfully"));
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
    console.log(AccessToken);

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
        new Apiresponce(
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
      .json(new Apiresponce(200, "user logout successfully"));
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
      .json(new Apiresponce(200, "password change success fully"));
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
    await user.findOneAndUpdate(currentUser, {
      $set: {
        avatar: uploadedAvatar.secure_url,
      },
    });

    return res
      .status(200)
      .json(
        new Apiresponce(200, uploadedAvatar, "profile change successfully")
      );
  } catch (e) {
    next(e);
  }
});
export { registerUser, login, logout, changePassword, changeAvatar };
