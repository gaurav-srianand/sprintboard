import { SESSION_COOKIE_NAME } from "./constants.js";
import { getSessionUser as getSessionUserDefault } from "./session.js";

export async function getAuthenticatedUser(request, deps = {}) {
  const getSessionUser = deps.getSessionUser || getSessionUserDefault;
  const token = request?.cookies?.get?.(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await getSessionUser(token);
  } catch {
    return null;
  }
}

export default getAuthenticatedUser;
