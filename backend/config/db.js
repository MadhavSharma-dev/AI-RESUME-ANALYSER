
import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

// Enforce strict field filtering on Mongoose queries
mongoose.set("strictQuery", true);

/**
 * Connects to MongoDB Atlas / Local MongoDB instance with production-grade
 * connection pooling, socket keep-alives, and automatic reconnection retry logic.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000, // Sends 10s ping frames to keep Atlas sockets alive
      maxPoolSize: 10,             // Maintains up to 10 concurrent DB worker sockets
      minPoolSize: 2               // Keeps 2 warm sockets ready for instant response
    });
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Retry initial connection after 5s delay on startup failure
    setTimeout(connectDB, 5000);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection dropped — automatically reconnecting...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully!");
  });

  mongoose.connection.on("error", (err) => {
    console.error(`MongoDB Socket Error: ${err.message}`);
  });
};

export default connectDB;
