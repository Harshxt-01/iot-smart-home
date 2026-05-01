import mongoose from "mongoose";

export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
    console.log("DB Name:", mongoose.connection.name);
    console.log("DB Host:", mongoose.connection.host);
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
}
