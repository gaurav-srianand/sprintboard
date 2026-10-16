import test, { before } from "node:test";
import assert from "node:assert/strict";

import { loginUser } from "../src/lib/auth/loginUser.js";
import { hashPassword } from "../src/lib/password.js";

const PASSWORD = "secret123";

let passwordHash;

before(async () => {
  passwordHash = await hashPassword(PASSWORD);
});

function fakeUserModel(doc) {
  return {
    findOne() {
      return { select: async () => doc };
    },
  };
}

function userDoc() {
  return {
    _id: "user-1",
    passwordHash,
    toJSON: () => ({ id: "user-1", name: "Ada", email: "ada@example.com" }),
  };
}

const noConnect = async () => {};

test("valid credentials: returns 200, sanitized user, and a session token", async () => {
  let sessionUserId = null;
  const deps = {
    connectDB: noConnect,
    User: fakeUserModel(userDoc()),
    createSession: async (userId) => {
      sessionUserId = userId;
      return { token: "raw-token", expiresAt: new Date() };
    },
  };

  const result = await loginUser(
    { email: "  Ada@Example.com ", password: PASSWORD },
    deps
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.token, "raw-token");
  assert.equal(sessionUserId, "user-1");
  assert.deepEqual(result.user, {
    id: "user-1",
    name: "Ada",
    email: "ada@example.com",
  });
  assert.ok(!("passwordHash" in result.user));
});

test("incorrect password: returns generic 401 and creates no session", async () => {
  let sessionCreated = false;
  const deps = {
    connectDB: noConnect,
    User: fakeUserModel(userDoc()),
    createSession: async () => {
      sessionCreated = true;
      return { token: "x", expiresAt: new Date() };
    },
  };

  const result = await loginUser(
    { email: "ada@example.com", password: "wrong-password" },
    deps
  );

  assert.equal(result.ok, false);
  assert.equal(result.kind, "invalid");
  assert.equal(result.status, 401);
  assert.equal(sessionCreated, false);
});

test("unknown email: returns generic 401 and creates no session", async () => {
  let sessionCreated = false;
  const deps = {
    connectDB: noConnect,
    User: fakeUserModel(null),
    createSession: async () => {
      sessionCreated = true;
      return { token: "x", expiresAt: new Date() };
    },
  };

  const result = await loginUser(
    { email: "nobody@example.com", password: PASSWORD },
    deps
  );

  assert.equal(result.ok, false);
  assert.equal(result.kind, "invalid");
  assert.equal(result.status, 401);
  assert.equal(sessionCreated, false);
});

test("wrong password and unknown email are indistinguishable", async () => {
  const wrongPassword = await loginUser(
    { email: "ada@example.com", password: "wrong-password" },
    { connectDB: noConnect, User: fakeUserModel(userDoc()) }
  );
  const unknownEmail = await loginUser(
    { email: "nobody@example.com", password: PASSWORD },
    { connectDB: noConnect, User: fakeUserModel(null) }
  );

  assert.deepEqual(wrongPassword, unknownEmail);
});

test("malformed input: returns 400 without touching the database", async () => {
  const explodingDeps = {
    connectDB: async () => {
      throw new Error("connectDB should not be called");
    },
    User: {
      findOne() {
        throw new Error("User.findOne should not be called");
      },
    },
  };

  const result = await loginUser({ email: "bad", password: "" }, explodingDeps);

  assert.equal(result.ok, false);
  assert.equal(result.kind, "validation");
  assert.equal(result.status, 400);
  assert.ok(result.details.email);
  assert.ok(result.details.password);
});

test("database failure: returns 500 without leaking internals", async () => {
  const result = await loginUser(
    { email: "ada@example.com", password: PASSWORD },
    {
      connectDB: async () => {
        throw new Error("connect ECONNREFUSED 1.2.3.4:27017");
      },
    }
  );

  assert.equal(result.ok, false);
  assert.equal(result.kind, "server");
  assert.equal(result.status, 500);
  assert.ok(!JSON.stringify(result).includes("ECONNREFUSED"));
});
