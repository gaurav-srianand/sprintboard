import test from "node:test";
import assert from "node:assert/strict";

import { registerUser } from "../src/lib/auth/registerUser.js";

const VALID_BODY = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "secret123",
};

function createFakeUser(captured) {
  return {
    create: async (doc) => {
      captured.doc = doc;

      return {
        toJSON: () => {
          const { passwordHash, ...safe } = doc;
          return {
            id: "507f1f77bcf86cd799439011",
            ...safe,
            createdAt: "2026-01-01T00:00:00.000Z",
          };
        },
      };
    },
  };
}

test("valid registration: returns 201, hashes the password, and hides the hash", async () => {
  const captured = {};
  const result = await registerUser(VALID_BODY, {
    connectDB: async () => {},
    User: createFakeUser(captured),
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 201);
  assert.equal(result.user.email, "ada@example.com");
  assert.equal(result.user.name, "Ada Lovelace");

  assert.ok(!("passwordHash" in result.user));
  assert.ok(!JSON.stringify(result.user).includes("secret123"));

  assert.notEqual(captured.doc.passwordHash, "secret123");
  assert.match(captured.doc.passwordHash, /^\$2[aby]\$/);
});

test("invalid input: returns 400 without touching the database", async () => {
  const explodingDeps = {
    connectDB: async () => {
      throw new Error("connectDB should not be called for invalid input");
    },
    User: {
      create: async () => {
        throw new Error("User.create should not be called for invalid input");
      },
    },
  };

  const result = await registerUser(
    { name: "", email: "nope", password: "123" },
    explodingDeps
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.kind, "validation");
  assert.ok(result.details.name);
  assert.ok(result.details.email);
  assert.ok(result.details.password);
});

test("duplicate email: returns 409 and does not leak database internals", async () => {
  const result = await registerUser(VALID_BODY, {
    connectDB: async () => {},
    User: {
      create: async () => {
        const error = new Error("E11000 duplicate key error collection: sprintboard.users");
        error.code = 11000;
        throw error;
      },
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.equal(result.kind, "duplicate");
  assert.ok(!JSON.stringify(result).includes("E11000"));
  assert.ok(!JSON.stringify(result).includes("sprintboard.users"));
});

test("database failure: returns 500 and does not leak the error", async () => {
  const result = await registerUser(VALID_BODY, {
    connectDB: async () => {
      throw new Error("connect ECONNREFUSED 1.2.3.4:27017");
    },
    User: {
      create: async () => {
        throw new Error("should not be reached");
      },
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 500);
  assert.equal(result.kind, "server");
  assert.ok(!JSON.stringify(result).includes("ECONNREFUSED"));
});
