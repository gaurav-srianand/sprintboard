import test from "node:test";
import assert from "node:assert/strict";

import {
  createLogger,
  errorMeta,
  redactMessage,
  requestIdFrom,
} from "../src/lib/log.js";

test("redactMessage removes URIs that could contain credentials", () => {
  const message = "failed to connect to mongodb+srv://user:p%40ss@cluster/db";
  const redacted = redactMessage(message);

  assert.ok(!redacted.includes("user"));
  assert.ok(!redacted.includes("pass"));
  assert.ok(redacted.includes("[redacted-uri]"));
});

test("redactMessage truncates very long messages and guards non-strings", () => {
  assert.equal(redactMessage("a".repeat(1000)).length, 300);
  assert.equal(redactMessage(undefined), undefined);
  assert.equal(redactMessage(1234), undefined);
});

test("errorMeta returns the name, safe code, and a redacted message", () => {
  const error = new Error("connect ECONNREFUSED mongodb://user:pass@host:27017");
  error.name = "MongooseServerSelectionError";
  error.code = "ETIMEDOUT";

  const meta = errorMeta(error);

  assert.equal(meta.errorName, "MongooseServerSelectionError");
  assert.equal(meta.errorCode, "ETIMEDOUT");
  assert.ok(meta.errorMessage.includes("[redacted-uri]"));
  assert.ok(!meta.errorMessage.includes("pass"));
});

test("errorMeta tolerates non-error values", () => {
  assert.deepEqual(errorMeta(null), { errorName: "UnknownError" });
  assert.deepEqual(errorMeta("boom"), { errorName: "UnknownError" });
});

test("requestIdFrom prefers correlation headers over generating an id", () => {
  const fromRequestId = requestIdFrom({
    headers: { get: (key) => (key === "x-request-id" ? "req-123" : null) },
  });
  assert.equal(fromRequestId, "req-123");

  const fromVercel = requestIdFrom({
    headers: { get: (key) => (key === "x-vercel-id" ? "iad1::abc" : null) },
  });
  assert.equal(fromVercel, "iad1::abc");

  const generated = requestIdFrom({ headers: { get: () => null } });
  assert.match(generated, /^[0-9a-f]{16}$/);
});

test("createLogger emits one JSON line per call with base and fields", () => {
  const calls = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (line) => calls.push({ level: "log", line });
  console.error = (line) => calls.push({ level: "error", line });

  try {
    const logger = createLogger({ requestId: "req-1", operation: "register" });
    logger.info("register.request_start");
    logger.error("register.unexpected_error", {
      errorName: "Error",
      ignored: undefined,
    });

    assert.equal(calls.length, 2);

    const infoEntry = JSON.parse(calls[0].line);
    assert.equal(infoEntry.level, "info");
    assert.equal(infoEntry.event, "register.request_start");
    assert.equal(infoEntry.requestId, "req-1");
    assert.equal(infoEntry.operation, "register");

    const errorEntry = JSON.parse(calls[1].line);
    assert.equal(calls[1].level, "error");
    assert.equal(errorEntry.errorName, "Error");
    assert.ok(!("ignored" in errorEntry));
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
});
