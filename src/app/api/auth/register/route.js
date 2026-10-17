import { registerUser } from "@/lib/auth/registerUser";
import { createLogger, errorMeta, requestIdFrom } from "@/lib/log";

export async function POST(request) {
  const requestId = requestIdFrom(request);
  const logger = createLogger({ requestId, operation: "register" });
  const startedAt = Date.now();

  logger.info("register.request_start");

  let body;

  try {
    body = await request.json();
  } catch {
    logger.warn("register.invalid_json", {
      durationMs: Date.now() - startedAt,
    });
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await registerUser(body, { logger });

    if (result.ok) {
      logger.info("register.request_complete", {
        status: result.status,
        durationMs: Date.now() - startedAt,
      });
      return Response.json({ user: result.user }, { status: result.status });
    }

    if (result.kind === "validation") {
      return Response.json(
        { error: "Validation failed", details: result.details },
        { status: result.status }
      );
    }

    if (result.kind === "duplicate") {
      return Response.json(
        { error: "Email already registered" },
        { status: result.status }
      );
    }

    return Response.json(
      { error: "Something went wrong" },
      { status: result.status }
    );
  } catch (error) {
    logger.error("register.unexpected_error", {
      durationMs: Date.now() - startedAt,
      ...errorMeta(error),
    });
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
