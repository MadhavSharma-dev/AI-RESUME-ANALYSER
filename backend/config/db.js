
import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

mongoose.set("strictQuery", true);


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  }
  catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDb disconnected");
  });
};

export default connectDB;
