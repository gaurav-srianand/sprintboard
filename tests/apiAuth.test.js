import test from "node:test";
import assert from "node:assert/strict";

import { getAuthenticatedUser } from "../src/lib/auth/apiAuth.js";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants.js";

function fakeRequest(cookieValue) {
  return {
    cookies: {
      get(name) {
        if (name !== SESSION_COOKIE_NAME || cookieValue === undefined) {
          return undefined;
        }
        return { value: cookieValue };
      },
    },
  };
}

test("returns null when no session cookie is present", async () => {
  const result = await getAuthenticatedUser(fakeRequest(undefined), {
    getSessionUser: async () => {
      throw new Error("getSessionUser should not be called without a cookie");
    },
  });

  assert.equal(result, null);
});

test("resolves the token to a sanitized user when the session is valid", async () => {
  let received;
  const result = await getAuthenticatedUser(fakeRequest("tok-123"), {
    getSessionUser: async (token) => {
      received = token;
      return { id: "user-1", name: "Ada", email: "ada@example.com" };
    },
  });

  assert.equal(received, "tok-123");
  assert.deepEqual(result, {
    id: "user-1",
    name: "Ada",
    email: "ada@example.com",
  });
});

test("returns null when the session is unknown or expired", async () => {
  const result = await getAuthenticatedUser(fakeRequest("stale"), {
    getSessionUser: async () => null,
  });

  assert.equal(result, null);
});

test("returns null when the session lookup throws", async () => {
  const result = await getAuthenticatedUser(fakeRequest("tok"), {
    getSessionUser: async () => {
      throw new Error("database is down");
    },
  });

  assert.equal(result, null);
});
