import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { httpServer } from "./socket_io/server.js";
import { Apierror } from "./utils/apiError.js";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`server is runnin on ${process.env.PORT}`);
      httpServer.on("error", (err) => {
        console.log("connection error", err);
        throw new Apierror(300, "connection error happend check your internet");
      });
    });
  })
  .catch((err) => {
    console.log("mongo db connection failed !!!", err);
  });
