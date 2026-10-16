import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  deleteSession,
} from "@/lib/auth/session";

export async function POST(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  try {
    await deleteSession(token);
  } catch {
    // Even if the delete fails, we still clear the cookie below.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
