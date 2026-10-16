import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "./lib/auth/constants.js";

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  if (request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
