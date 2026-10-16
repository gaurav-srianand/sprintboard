import crypto from "node:crypto";

import connectDBDefault from "../mongodb.js";
import SessionDefault from "../../models/Session.js";
import UserDefault from "../../models/User.js";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "./constants.js";

export { SESSION_COOKIE_NAME, SESSION_TTL_MS };

function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export async function createSession(userId, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Session = deps.Session || SessionDefault;
  const now = deps.now ? deps.now() : Date.now();

  await connectDB();

  const token = generateToken();
  const expiresAt = new Date(now + SESSION_TTL_MS);

  await Session.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getSessionUser(token, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Session = deps.Session || SessionDefault;
  const User = deps.User || UserDefault;
  const now = deps.now ? deps.now() : Date.now();

  if (!token) {
    return null;
  }

  await connectDB();

  const session = await Session.findOne({ tokenHash: hashToken(token) });
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= now) {
    await Session.deleteOne({ _id: session._id });
    return null;
  }

  const user = await User.findById(session.userId);
  if (!user) {
    return null;
  }

  return user.toJSON();
}

export async function deleteSession(token, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Session = deps.Session || SessionDefault;

  if (!token) {
    return { deletedCount: 0 };
  }

  await connectDB();

  return Session.deleteOne({ tokenHash: hashToken(token) });
}

export async function deleteAllSessions(userId, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Session = deps.Session || SessionDefault;

  await connectDB();

  return Session.deleteMany({ userId });
}
