import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI: add it to .env.local and restart the dev server"
    );
  }

  if (globalThis._mongooseConn) {
    return globalThis._mongooseConn;
  }

  globalThis._mongooseConn = mongoose.connect(MONGODB_URI);
  return globalThis._mongooseConn;
}

export default connectDB;
