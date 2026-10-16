import test from "node:test";
import assert from "node:assert/strict";

import { mapAuthError } from "../src/lib/api/authClient.js";

test("maps 400 to a validation error with field details", () => {
  const result = mapAuthError(400, {
    error: "Validation failed",
    details: { email: "Enter a valid email address" },
  });

  assert.equal(result.kind, "validation");
  assert.deepEqual(result.fieldErrors, {
    email: "Enter a valid email address",
  });
});

test("maps 400 without structured details to empty field errors", () => {
  const result = mapAuthError(400, { error: "Validation failed" });

  assert.equal(result.kind, "validation");
  assert.deepEqual(result.fieldErrors, {});
});

test("maps 401 to a generic invalid-credentials error", () => {
  const result = mapAuthError(401, { error: "Invalid email or password" });

  assert.equal(result.kind, "invalid");
  assert.deepEqual(result.fieldErrors, {});
  assert.match(result.message, /invalid email or password/i);
});

test("maps 409 to a duplicate-email error on the email field", () => {
  const result = mapAuthError(409, { error: "Email already registered" });

  assert.equal(result.kind, "duplicate");
  assert.ok(result.fieldErrors.email);
});

test("maps 429 without a retry hint to a generic rate-limit message", () => {
  const result = mapAuthError(429, { error: "Too many login attempts" }, null);

  assert.equal(result.kind, "rateLimited");
  assert.equal(result.retryAfterSeconds, null);
});

test("maps 429 with a retry hint to a message including the seconds", () => {
  const result = mapAuthError(429, { error: "Too many login attempts" }, 30);

  assert.equal(result.kind, "rateLimited");
  assert.equal(result.retryAfterSeconds, 30);
  assert.match(result.message, /30s/);
});

test("maps 500 and unknown statuses to a server error", () => {
  assert.equal(mapAuthError(500, null).kind, "server");
  assert.equal(mapAuthError(503, null).kind, "server");
  assert.equal(mapAuthError(418, { error: "teapot" }).kind, "server");
});
