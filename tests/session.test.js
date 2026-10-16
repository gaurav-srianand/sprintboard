import test from "node:test";
import assert from "node:assert/strict";

import {
  createSession,
  getSessionUser,
  deleteSession,
  deleteAllSessions,
  sessionCookieOptions,
  SESSION_TTL_MS,
} from "../src/lib/auth/session.js";

function createFakeSessionStore() {
  const rows = [];

  const Session = {
    async create(doc) {
      const row = { _id: `session-${rows.length + 1}`, ...doc };
      rows.push(row);
      return row;
    },
    async findOne(query) {
      return rows.find((row) => row.tokenHash === query.tokenHash) || null;
    },
    async deleteOne(query) {
      const index = rows.findIndex((row) =>
        query._id !== undefined
          ? row._id === query._id
          : row.tokenHash === query.tokenHash
      );
      if (index === -1) return { deletedCount: 0 };
      rows.splice(index, 1);
      return { deletedCount: 1 };
    },
    async deleteMany(query) {
      let deletedCount = 0;
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        if (String(rows[i].userId) === String(query.userId)) {
          rows.splice(i, 1);
          deletedCount += 1;
        }
      }
      return { deletedCount };
    },
  };

  return { rows, Session };
}

const noConnect = async () => {};

const USER = { id: "user-1", name: "Ada", email: "ada@example.com" };

const fakeUserModel = {
  async findById() {
    return { toJSON: () => USER };
  },
};

test("createSession stores a hash of the token, never the raw token", async () => {
  const { rows, Session } = createFakeSessionStore();

  const { token, expiresAt } = await createSession("user-1", {
    connectDB: noConnect,
    Session,
    now: () => 1_000_000,
  });

  assert.equal(typeof token, "string");
  assert.ok(token.length > 20);
  assert.equal(rows.length, 1);
  assert.notEqual(rows[0].tokenHash, token);
  assert.match(rows[0].tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(String(rows[0].userId), "user-1");
  assert.equal(expiresAt.getTime(), 1_000_000 + SESSION_TTL_MS);
});

test("getSessionUser resolves a valid token to a sanitized user", async () => {
  const { Session } = createFakeSessionStore();
  const deps = { connectDB: noConnect, Session, User: fakeUserModel };

  const { token } = await createSession("user-1", deps);
  const user = await getSessionUser(token, deps);

  assert.deepEqual(user, USER);
  assert.ok(!("passwordHash" in user));
});

test("getSessionUser returns null for an unknown token", async () => {
  const { Session } = createFakeSessionStore();
  const deps = { connectDB: noConnect, Session, User: fakeUserModel };

  assert.equal(await getSessionUser("not-a-real-token", deps), null);
});

test("getSessionUser returns null and deletes an expired session", async () => {
  const { rows, Session } = createFakeSessionStore();
  const deps = { connectDB: noConnect, Session, User: fakeUserModel };

  const { token } = await createSession("user-1", { ...deps, now: () => 0 });
  const user = await getSessionUser(token, {
    ...deps,
    now: () => SESSION_TTL_MS + 1,
  });

  assert.equal(user, null);
  assert.equal(rows.length, 0);
});

test("getSessionUser returns null when no token is supplied", async () => {
  const { Session } = createFakeSessionStore();
  const deps = { connectDB: noConnect, Session, User: fakeUserModel };

  assert.equal(await getSessionUser(undefined, deps), null);
});

test("deleteSession revokes a session so it no longer resolves", async () => {
  const { Session } = createFakeSessionStore();
  const deps = { connectDB: noConnect, Session, User: fakeUserModel };

  const { token } = await createSession("user-1", deps);
  await deleteSession(token, deps);

  assert.equal(await getSessionUser(token, deps), null);
});

test("deleteAllSessions removes every session for a user", async () => {
  const { rows, Session } = createFakeSessionStore();
  const deps = { connectDB: noConnect, Session, User: fakeUserModel };

  await createSession("user-1", deps);
  await createSession("user-1", deps);
  await createSession("user-2", deps);

  const result = await deleteAllSessions("user-1", deps);

  assert.equal(result.deletedCount, 2);
  assert.equal(rows.length, 1);
  assert.equal(String(rows[0].userId), "user-2");
});

test("sessionCookieOptions are safe and follow NODE_ENV for secure", () => {
  const options = sessionCookieOptions();

  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, SESSION_TTL_MS / 1000);
  assert.equal(options.secure, process.env.NODE_ENV === "production");
});
