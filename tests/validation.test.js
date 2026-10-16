import test from "node:test";
import assert from "node:assert/strict";

import {
  validateRegistration,
  validateLogin,
  normalizeEmail,
} from "../src/lib/validation.js";

test("accepts a valid payload and normalizes name/email", () => {
  const { valid, errors, data } = validateRegistration({
    name: "  Ada Lovelace  ",
    email: "  Ada@Example.com ",
    password: "secret123",
  });

  assert.equal(valid, true);
  assert.deepEqual(errors, {});
  assert.deepEqual(data, {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "secret123",
  });
});

test("rejects a payload with all fields missing", () => {
  const { valid, errors, data } = validateRegistration({});

  assert.equal(valid, false);
  assert.equal(data, null);
  assert.ok(errors.name);
  assert.ok(errors.email);
  assert.ok(errors.password);
});

test("rejects an invalid email format", () => {
  const { valid, errors } = validateRegistration({
    name: "Ada",
    email: "not-an-email",
    password: "secret123",
  });

  assert.equal(valid, false);
  assert.equal(errors.email, "Invalid email format");
});

test("rejects a whitespace-only name", () => {
  const { valid, errors } = validateRegistration({
    name: "   ",
    email: "ada@example.com",
    password: "secret123",
  });

  assert.equal(valid, false);
  assert.ok(errors.name);
});

test("rejects passwords shorter than 8 characters", () => {
  const { valid, errors } = validateRegistration({
    name: "Ada",
    email: "ada@example.com",
    password: "short",
  });

  assert.equal(valid, false);
  assert.match(errors.password, /at least 8/);
});

test("rejects passwords longer than 72 characters", () => {
  const { valid, errors } = validateRegistration({
    name: "Ada",
    email: "ada@example.com",
    password: "a".repeat(73),
  });

  assert.equal(valid, false);
  assert.match(errors.password, /at most 72/);
});

test("normalizeEmail trims, lowercases, and guards non-strings", () => {
  assert.equal(normalizeEmail("  Foo@Bar.COM "), "foo@bar.com");
  assert.equal(normalizeEmail(undefined), "");
  assert.equal(normalizeEmail(42), "");
});

test("login: accepts valid credentials and normalizes the email", () => {
  const { valid, errors, data } = validateLogin({
    email: "  Ada@Example.com ",
    password: "secret123",
  });

  assert.equal(valid, true);
  assert.deepEqual(errors, {});
  assert.deepEqual(data, { email: "ada@example.com", password: "secret123" });
});

test("login: rejects a missing password", () => {
  const { valid, errors } = validateLogin({
    email: "ada@example.com",
    password: "",
  });

  assert.equal(valid, false);
  assert.ok(errors.password);
});

test("login: rejects a missing or invalid email", () => {
  const missing = validateLogin({ email: "", password: "secret123" });
  const invalid = validateLogin({ email: "nope", password: "secret123" });

  assert.equal(missing.valid, false);
  assert.ok(missing.errors.email);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.email, "Invalid email format");
});

test("login: does not enforce password length (only presence)", () => {
  const { valid } = validateLogin({
    email: "ada@example.com",
    password: "x",
  });

  assert.equal(valid, true);
});

