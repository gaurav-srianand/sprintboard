import mongoose from "mongoose";

import { createLogger, errorMeta } from "./log.js";

const SERVER_SELECTION_TIMEOUT_MS = 30000;
const connectionLogger = createLogger({ operation: "db" });

async function connectDB(deps = {}) {
  const logger = deps.logger || connectionLogger;
  const connect = deps.connect || mongoose.connect;
  const uri = deps.uri ?? process.env.MONGODB_URI;

  if (!uri) {
    const error = new Error(
      "Missing MONGODB_URI: add it to .env.local and restart the dev server"
    );
    error.name = "ConfigurationError";
    logger?.error("db.connect_failed", {
      reason: "missing_uri",
      ...errorMeta(error),
    });
    throw error;
  }

  if (globalThis._mongooseConn) {
    return globalThis._mongooseConn;
  }

  const startedAt = Date.now();
  logger?.info("db.connect_start");

  const connection = connect(uri, {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  });

  const guarded = connection.then(
    (value) => {
      logger?.info("db.connect_success", { durationMs: Date.now() - startedAt });
      return value;
    },
    (error) => {
      // Do not cache a rejected connection: clear it so the next request on this
      // warm instance can retry instead of instantly reusing the failure.
      if (globalThis._mongooseConn === guarded) {
        globalThis._mongooseConn = null;
      }
      logger?.error("db.connect_failed", {
        durationMs: Date.now() - startedAt,
        ...errorMeta(error),
      });
      throw error;
    }
  );

  globalThis._mongooseConn = guarded;
  return guarded;
}

export default connectDB;
