import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

export async function GET() {
  let database = "error";
  let httpStatus = 200;

  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    database = "ok";
  } catch {
    httpStatus = 503;
  }

  return Response.json(
    {
      status: httpStatus === 200 ? "ok" : "degraded",
      database,
      timestamp: new Date().toISOString(),
    },
    { status: httpStatus }
  );
}
