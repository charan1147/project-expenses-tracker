import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./config/db.js";
import errorHandler from "./middlewares/errorHandler.js";

import userRoutes from "./routes/authRoutes.js";
import personalExpenseRoutes from "./routes/personalExpenseRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [process.env.CLIENT_URL],
    credentials: true,
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/personal-expenses", personalExpenseRoutes);
app.use("/api/groups", groupRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "API is healthy",
    timestamp: new Date(),
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
