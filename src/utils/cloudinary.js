import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Apierror } from "./apiError.js";

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

const uploadOnCloudinary = async (localFilePath) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    if (!localFilePath) {
      throw new Apierror(401, "local file path is not found");
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file upload successfully", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log("cloudinary error", error);
    return null;
  }
};
const deleteInCloudinary = async (cloudPath_publicId) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log(cloudPath_publicId);

    if (!cloudPath_publicId) {
      throw new Apierror(402, "cloud Path not avilable");
    }

    const res = await cloudinary.uploader.destroy(cloudPath_publicId);
    console.log(res);

    return res;
  } catch (error) {
    console.log(error);
    return null;
  }
};
export { uploadOnCloudinary, deleteInCloudinary };
