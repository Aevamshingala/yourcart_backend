import { mongoose } from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = mongoose.connect(
      `${process.env.MONGODB_URI}${DB_NAME}`
    );
    // console.log(
    //   `\n mongodb connected !! db host : ${connectionInstance.connection.host}`
    // );
    console.log("database connected successfully");
  } catch (e) {
    console.log("error in connectDB ", e);
    process.exit(1);
  }
};

export default connectDB;
