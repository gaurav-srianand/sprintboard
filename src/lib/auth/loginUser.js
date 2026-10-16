import connectDBDefault from "../mongodb.js";
import UserDefault from "../../models/User.js";
import { verifyPassword } from "../password.js";
import { validateLogin } from "../validation.js";
import { createSession as createSessionDefault } from "./session.js";

const DUMMY_HASH =
  "$2b$10$pjfziBGWw2MQcizFjG9TOeRP7G0WWtVgrbIVv4tuONPkB89d0cJwy";

export async function loginUser(body, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const User = deps.User || UserDefault;
  const createSession = deps.createSession || createSessionDefault;

  const { valid, errors, data } = validateLogin(body);

  if (!valid) {
    return { ok: false, kind: "validation", status: 400, details: errors };
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: data.email }).select(
      "+passwordHash"
    );

    if (!user) {
      await verifyPassword(data.password, DUMMY_HASH);
      return { ok: false, kind: "invalid", status: 401 };
    }

    const passwordMatches = await verifyPassword(
      data.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return { ok: false, kind: "invalid", status: 401 };
    }

    const { token, expiresAt } = await createSession(user._id);

    return { ok: true, status: 200, user: user.toJSON(), token, expiresAt };
  } catch {
    return { ok: false, kind: "server", status: 500 };
  }
}

export default loginUser;
