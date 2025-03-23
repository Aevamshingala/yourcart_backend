import { Post } from "../models/post.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/apiError.js";
import { Apiresponse } from "../utils/apiResponce.js";

const createPost = asynchandler(async (req, res, next) => {
  try {
    const { title, imageUrl, description, link, category } = req.body;
    const alldetails = [
      { title: title },
      { imageUrl: imageUrl },
      { description: description },
      { link: link },
      { category: category },
    ];
    alldetails.map((obj, i) => {
      const [key, value] = Object.entries(obj)[0]; // it give array in side array so i use [0]
      if (!value) {
        console.log(i, "index");
        throw new Apierror(404, `${key} not found`);
      }
    });
    const currentpost = await Post.create({
      title,
      imageUrl,
      creater: req.user?._id,
      description,
      link,
      category,
      isLike: false,
      likeCount: 0,
    });

    return res
      .status(200)
      .json(new Apiresponse(200, currentpost, "post create success fully"));
  } catch (error) {
    next(error);
  }
});
const specificUserData = asynchandler(async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      throw new Apierror(401, "userId not found");
    }
    const userPostData = await Post.find({ creater: userId });
    if (!userPostData) {
      throw new Apierror(402, "No post data found ");
    }
    return res
      .status(200)
      .json(new Apiresponse(200, userPostData, "data fetch successfully"));
  } catch (error) {
    next(error);
  }
});
export { createPost, specificUserData };
