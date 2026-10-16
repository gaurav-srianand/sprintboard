import connectDBDefault from "../mongodb.js";
import UserDefault from "../../models/User.js";
import { hashPassword } from "../password.js";
import { validateRegistration } from "../validation.js";

export async function registerUser(body, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const User = deps.User || UserDefault;

  const { valid, errors, data } = validateRegistration(body);

  if (!valid) {
    return { ok: false, kind: "validation", status: 400, details: errors };
  }

  try {
    await connectDB();
    const passwordHash = await hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    return { ok: true, status: 201, user: user.toJSON() };
  } catch (err) {
    if (err && err.code === 11000) {
      return { ok: false, kind: "duplicate", status: 409 };
    }
    return { ok: false, kind: "server", status: 500 };
  }
}

export default registerUser;
