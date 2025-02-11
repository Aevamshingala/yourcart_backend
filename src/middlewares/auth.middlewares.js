import jwt from "jsonwebtoken";
import { Apierror } from "../utils/apiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import { user as usermodel } from "../models/user.model.js";

const verifyJwt = asynchandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    // console.log(token);

    if (!token) {
      throw new Apierror(401, "user not found in token");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log(decodedToken?._id);

    const Currentuser = await usermodel
      .findById(decodedToken?._id)
      .select("-password,-refreshToken");

    if (!Currentuser) {
      throw new Apierror(401, "users access token is not valid");
    }
    console.log(Currentuser);

    req.user = Currentuser;
    // console.log(req.user);

    next();
  } catch (error) {
    next(error);
  }
});
export { verifyJwt };
