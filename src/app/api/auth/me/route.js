import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, getSessionUser } from "@/lib/auth/session";

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let user = null;
  try {
    user = await getSessionUser(token);
  } catch {
    user = null;
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
