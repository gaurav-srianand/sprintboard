import test from "node:test";
import assert from "node:assert/strict";

import {
  validateTaskCreate,
  validateTaskUpdate,
} from "../src/lib/boards/validation.js";

test("validateTaskCreate applies default status and priority", () => {
  const { valid, data } = validateTaskCreate({ title: "Write tests" });
  assert.equal(valid, true);
  assert.deepEqual(data, {
    title: "Write tests",
    description: "",
    status: "todo",
    priority: "medium",
  });
});

test("validateTaskCreate accepts explicit status and priority", () => {
  const { valid, data } = validateTaskCreate({
    title: "Deploy",
    description: "ship it",
    status: "in_progress",
    priority: "high",
  });
  assert.equal(valid, true);
  assert.equal(data.status, "in_progress");
  assert.equal(data.priority, "high");
});

test("validateTaskCreate rejects an invalid status", () => {
  const { valid, errors } = validateTaskCreate({ title: "X", status: "blocked" });
  assert.equal(valid, false);
  assert.ok(errors.status);
});

test("validateTaskCreate rejects an invalid priority", () => {
  const { valid, errors } = validateTaskCreate({ title: "X", priority: "urgent" });
  assert.equal(valid, false);
  assert.ok(errors.priority);
});

test("validateTaskCreate rejects a missing title", () => {
  const { valid, errors } = validateTaskCreate({});
  assert.equal(valid, false);
  assert.ok(errors.title);
});

test("validateTaskUpdate accepts only the provided fields", () => {
  const { valid, data } = validateTaskUpdate({ status: "done" });
  assert.equal(valid, true);
  assert.deepEqual(data, { status: "done" });
});

test("validateTaskUpdate rejects an empty update", () => {
  const { valid, errors } = validateTaskUpdate({});
  assert.equal(valid, false);
  assert.ok(errors.body);
});

test("validateTaskUpdate rejects an invalid status", () => {
  const { valid, errors } = validateTaskUpdate({ status: "nope" });
  assert.equal(valid, false);
  assert.ok(errors.status);
});
