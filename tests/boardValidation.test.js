import test from "node:test";
import assert from "node:assert/strict";

import {
  isValidObjectId,
  validateBoardCreate,
  validateBoardUpdate,
} from "../src/lib/boards/validation.js";

test("isValidObjectId accepts only strict 24-char hex strings", () => {
  assert.equal(isValidObjectId("507f1f77bcf86cd799439011"), true);
  assert.equal(isValidObjectId("00000000000000000000000a"), true);
  assert.equal(isValidObjectId("507F1F77BCF86CD799439011"), true);
  assert.equal(isValidObjectId("507f1f77bcf86cd79943901"), false);
  assert.equal(isValidObjectId("507f1f77bcf86cd7994390111"), false);
  assert.equal(isValidObjectId("zzzzzzzzzzzzzzzzzzzzzzzz"), false);
  assert.equal(isValidObjectId("board-1"), false);
  assert.equal(isValidObjectId(123), false);
  assert.equal(isValidObjectId(null), false);
});

test("validateBoardCreate accepts a valid payload and trims fields", () => {
  const { valid, errors, data } = validateBoardCreate({
    title: "  Sprint 1  ",
    description: "  Plan it  ",
  });

  assert.equal(valid, true);
  assert.deepEqual(errors, {});
  assert.deepEqual(data, { title: "Sprint 1", description: "Plan it" });
});

test("validateBoardCreate defaults description to an empty string", () => {
  const { valid, data } = validateBoardCreate({ title: "Sprint" });
  assert.equal(valid, true);
  assert.equal(data.description, "");
});

test("validateBoardCreate rejects a missing or blank title", () => {
  assert.equal(validateBoardCreate({}).valid, false);
  assert.ok(validateBoardCreate({}).errors.title);
  assert.equal(validateBoardCreate({ title: "   " }).valid, false);
  assert.equal(validateBoardCreate({ title: 42 }).valid, false);
});

test("validateBoardCreate enforces title and description length limits", () => {
  assert.equal(validateBoardCreate({ title: "a".repeat(101) }).valid, false);
  assert.equal(
    validateBoardCreate({ title: "ok", description: "a".repeat(2001) }).valid,
    false
  );
});

test("validateBoardUpdate accepts a partial update", () => {
  const { valid, data } = validateBoardUpdate({ description: "  Updated  " });
  assert.equal(valid, true);
  assert.deepEqual(data, { description: "Updated" });
});

test("validateBoardUpdate rejects an empty update", () => {
  const { valid, errors } = validateBoardUpdate({});
  assert.equal(valid, false);
  assert.ok(errors.body);
});

test("validateBoardUpdate rejects a blank title", () => {
  const { valid, errors } = validateBoardUpdate({ title: "   " });
  assert.equal(valid, false);
  assert.ok(errors.title);
});
