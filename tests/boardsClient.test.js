import test from "node:test";
import assert from "node:assert/strict";

import { mapBoardError } from "../src/lib/api/boardsClient.js";

test("maps 401 to an unauthorized error with a re-login message", () => {
  const error = mapBoardError(401, { error: "Not authenticated" });
  assert.equal(error.kind, "unauthorized");
  assert.deepEqual(error.fieldErrors, {});
});

test("maps 400 validation failures to field errors", () => {
  const error = mapBoardError(400, {
    error: "Validation failed",
    details: { title: "Title is required" },
  });
  assert.equal(error.kind, "validation");
  assert.equal(error.fieldErrors.title, "Title is required");
});

test("maps 400 invalid JSON to a validation error without field errors", () => {
  const error = mapBoardError(400, { error: "Invalid JSON body" });
  assert.equal(error.kind, "validation");
  assert.equal(error.message, "Invalid JSON body");
  assert.deepEqual(error.fieldErrors, {});
});

test("maps 404 to a notFound error", () => {
  const error = mapBoardError(404, { error: "Not found" });
  assert.equal(error.kind, "notFound");
});

test("maps 500 and unknown statuses to a generic server error", () => {
  assert.equal(mapBoardError(500, null).kind, "server");
  assert.equal(mapBoardError(418, { error: "teapot" }).kind, "server");
});

test("never includes arbitrary response text in the message", () => {
  const error = mapBoardError(500, { error: "secret internal detail" });
  assert.ok(!error.message.includes("secret internal detail"));
});

test("tolerates a null body", () => {
  const error = mapBoardError(500, null);
  assert.equal(error.kind, "server");
  assert.deepEqual(error.fieldErrors, {});
});
