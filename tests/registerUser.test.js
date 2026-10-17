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

function createCapturingLogger() {
  const events = [];
  const record = (level) => (event, fields) =>
    events.push({ level, event, ...fields });

  return {
    events,
    info: record("info"),
    warn: record("warn"),
    error: record("error"),
  };
}

test("validation failure logs at info level and never as a server error", async () => {
  const logger = createCapturingLogger();

  const result = await registerUser(
    { name: "", email: "nope", password: "123" },
    {
      connectDB: async () => {},
      User: { create: async () => ({ toJSON: () => ({}) }) },
      logger,
    }
  );

  assert.equal(result.status, 400);
  assert.equal(logger.events.length, 1);
  assert.equal(logger.events[0].level, "info");
  assert.equal(logger.events[0].event, "register.validation_failed");
  assert.deepEqual(logger.events[0].fields, ["name", "email", "password"]);
  assert.ok(!logger.events.some((entry) => entry.level === "error"));
});

test("password hashing failure returns 500 and logs the error", async () => {
  const logger = createCapturingLogger();

  const result = await registerUser(VALID_BODY, {
    connectDB: async () => {},
    hashPassword: async () => {
      const error = new Error("bcrypt failed mongodb://user:pass@host/db");
      error.name = "BcryptError";
      throw error;
    },
    User: {
      create: async () => {
        throw new Error("should not be reached");
      },
    },
    logger,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 500);

  const failure = logger.events.find(
    (entry) => entry.event === "register.password_hash_failed"
  );
  assert.ok(failure);
  assert.equal(failure.level, "error");
  assert.equal(failure.errorName, "BcryptError");
  assert.ok(!failure.errorMessage.includes("pass"));
});

test("successful creation logs the created user without sensitive data", async () => {
  const logger = createCapturingLogger();
  const captured = {};

  const result = await registerUser(VALID_BODY, {
    connectDB: async () => {},
    User: createFakeUser(captured),
    logger,
  });

  assert.equal(result.status, 201);

  const created = logger.events.find(
    (entry) => entry.event === "register.user_created"
  );
  assert.ok(created);
  assert.equal(created.level, "info");

  const serialized = JSON.stringify(logger.events);
  assert.ok(!serialized.includes("secret123"));
  assert.ok(!serialized.includes("passwordHash"));
});

test("connect failure is only logged by connectDB, not duplicated by the service", async () => {
  const logger = createCapturingLogger();

  const result = await registerUser(VALID_BODY, {
    connectDB: async () => {
      throw new Error("connect ECONNREFUSED 1.2.3.4:27017");
    },
    User: { create: async () => ({ toJSON: () => ({}) }) },
    logger,
  });

  assert.equal(result.status, 500);
  assert.equal(logger.events.length, 0);
});
