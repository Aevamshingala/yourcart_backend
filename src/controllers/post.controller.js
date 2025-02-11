import { Post } from "../models/post.model";
import { asynchandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/apiError.js";
import { Apiresponce } from "../utils/apiResponce.js";

const createPost = asynchandler(async (req, res, next) => {
  try {
    const { title, imageUrl, description, link } = req.body;
    const alldetails = [
      { title: title },
      { imageUrl: imageUrl },
      { description: description },
      { link: link },
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
      description,
      link,
      isLike: false,
      likeCount: 0,
    });

    return res
      .status(200)
      .json(new Apiresponce(200, currentpost, "post create success fully"));
  } catch (error) {
    next(error);
  }
});

export { createPost };
