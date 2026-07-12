import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";

// Load Environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Ensure uploads directory exists for file saving
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Middleware setup
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from front-end Vite port
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statically host uploaded documents
app.use("/uploads", express.static("uploads"));

// Route Mountings
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/activity", activityRoutes);

// Base Ping Route
app.get("/", (req, res) => {
  res.json({ status: "healthy", service: "Resume Roaster API" });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[Server] running on port ${PORT}`);
});
