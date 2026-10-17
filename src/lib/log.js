import crypto from "node:crypto";

const URI_PATTERN = /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s"'<>]+/g;
const MAX_MESSAGE_LENGTH = 300;

export function redactMessage(message) {
  if (typeof message !== "string") {
    return undefined;
  }

  return message.replace(URI_PATTERN, "[redacted-uri]").slice(0, MAX_MESSAGE_LENGTH);
}

export function errorMeta(error) {
  if (!error || typeof error !== "object") {
    return { errorName: "UnknownError" };
  }

  const meta = { errorName: error.name || "Error" };

  if (typeof error.code === "number" || typeof error.code === "string") {
    meta.errorCode = error.code;
  }

  const message = redactMessage(error.message);
  if (message) {
    meta.errorMessage = message;
  }

  return meta;
}

export function requestIdFrom(request) {
  const header =
    request?.headers?.get?.("x-request-id") ||
    request?.headers?.get?.("x-vercel-id");

  if (typeof header === "string" && header.length > 0) {
    return header.slice(0, 100);
  }

  return crypto.randomBytes(8).toString("hex");
}

export function createLogger(base = {}) {
  function emit(level, event, fields) {
    const entry = { level, event, ...base };

    if (fields) {
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          entry[key] = value;
        }
      }
    }

    const line = JSON.stringify(entry);

    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    info: (event, fields) => emit("info", event, fields),
    warn: (event, fields) => emit("warn", event, fields),
    error: (event, fields) => emit("error", event, fields),
  };
}
