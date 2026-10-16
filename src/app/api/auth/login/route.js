import { NextResponse } from "next/server";

import { loginUser } from "@/lib/auth/loginUser";
import { loginRateLimit } from "@/lib/auth/loginRateLimit";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/validation";

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request) {
  let body = {};
  let malformed = false;

  try {
    body = await request.json();
  } catch {
    malformed = true;
  }

  const ip = getClientIp(request);
  const email = normalizeEmail(body && body.email);

  const limit = loginRateLimit.check({ ip, email });
  if (!limit.ok) {
    const retryAfterSeconds = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: limit.status,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  if (malformed) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await loginUser(body);

  if (result.ok) {
    loginRateLimit.reset({ ip, email });

    const response = NextResponse.json(
      { user: result.user },
      { status: result.status }
    );
    response.cookies.set(
      SESSION_COOKIE_NAME,
      result.token,
      sessionCookieOptions()
    );
    return response;
  }

  if (result.kind === "validation") {
    return NextResponse.json(
      { error: "Validation failed", details: result.details },
      { status: result.status }
    );
  }

  if (result.kind === "invalid") {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { error: "Something went wrong" },
    { status: result.status }
  );
}
