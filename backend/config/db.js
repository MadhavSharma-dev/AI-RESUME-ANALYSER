
import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000, // Keeps connection alive continuously via 10s pings
      maxPoolSize: 10,
      minPoolSize: 2
    });
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Retry initial connection after 5s delay
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
