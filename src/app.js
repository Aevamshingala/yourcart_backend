import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    // origin: process.env.CROS_ORIGEN,
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.static("public"));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

import { userrouter } from "./routes/user.router.js";

app.use("/api/v1/user", userrouter);


app.use((err, _, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: err.success,
    message: err.message || "Internal Server Error",
    error: err.errors || [],
  });
});

export { app };