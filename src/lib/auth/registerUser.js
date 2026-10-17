import connectDBDefault from "../mongodb.js";
import UserDefault from "../../models/User.js";
import { hashPassword as hashPasswordDefault } from "../password.js";
import { validateRegistration } from "../validation.js";
import { errorMeta } from "../log.js";

export async function registerUser(body, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const User = deps.User || UserDefault;
  const hashPassword = deps.hashPassword || hashPasswordDefault;
  const logger = deps.logger;

  const { valid, errors, data } = validateRegistration(body);

  if (!valid) {
    logger?.info("register.validation_failed", {
      fields: Object.keys(errors),
    });
    return { ok: false, kind: "validation", status: 400, details: errors };
  }

  try {
    await connectDB({ logger });
  } catch {
    // connectDB logs its own failure; do not log the same exception again.
    return { ok: false, kind: "server", status: 500 };
  }

  const hashStartedAt = Date.now();
  let passwordHash;
  try {
    passwordHash = await hashPassword(data.password);
  } catch (error) {
    logger?.error("register.password_hash_failed", {
      durationMs: Date.now() - hashStartedAt,
      ...errorMeta(error),
    });
    return { ok: false, kind: "server", status: 500 };
  }

  const createStartedAt = Date.now();
  try {
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    logger?.info("register.user_created", {
      durationMs: Date.now() - createStartedAt,
    });
    return { ok: true, status: 201, user: user.toJSON() };
  } catch (error) {
    if (error && error.code === 11000) {
      logger?.info("register.duplicate_email");
      return { ok: false, kind: "duplicate", status: 409 };
    }

    logger?.error("register.user_create_failed", {
      durationMs: Date.now() - createStartedAt,
      ...errorMeta(error),
    });
    return { ok: false, kind: "server", status: 500 };
  }
}

export default registerUser;
