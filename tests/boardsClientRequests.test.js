import test from "node:test";
import assert from "node:assert/strict";

import {
  createBoard,
  updateBoard,
  deleteBoard,
} from "../src/lib/api/boardsClient.js";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

async function withFetch(handler, run) {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return handler(url, options);
  };

  try {
    return await run(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("createBoard POSTs JSON to /api/boards", async () => {
  await withFetch(
    () => jsonResponse(201, { board: { id: "b1", title: "X" } }),
    async (calls) => {
      const result = await createBoard({ title: "X" });

      assert.equal(result.ok, true);
      assert.equal(result.data.board.id, "b1");
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, "/api/boards");
      assert.equal(calls[0].options.method, "POST");
      assert.equal(
        calls[0].options.headers["Content-Type"],
        "application/json"
      );
      assert.deepEqual(JSON.parse(calls[0].options.body), { title: "X" });
    }
  );
});

test("updateBoard PATCHes /api/boards/:id with the provided fields", async () => {
  await withFetch(
    () => jsonResponse(200, { board: { id: "b1", title: "Renamed" } }),
    async (calls) => {
      const result = await updateBoard("b1", {
        title: "Renamed",
        description: "Updated",
      });

      assert.equal(result.ok, true);
      assert.equal(result.data.board.title, "Renamed");
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, "/api/boards/b1");
      assert.equal(calls[0].options.method, "PATCH");
      assert.deepEqual(JSON.parse(calls[0].options.body), {
        title: "Renamed",
        description: "Updated",
      });
    }
  );
});

test("deleteBoard sends a DELETE with no body and reports success", async () => {
  await withFetch(
    () => jsonResponse(200, { ok: true }),
    async (calls) => {
      const result = await deleteBoard("b1");

      assert.equal(result.ok, true);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, "/api/boards/b1");
      assert.equal(calls[0].options.method, "DELETE");
      assert.equal(calls[0].options.body, undefined);
      assert.deepEqual(calls[0].options.headers, {});
    }
  );
});

test("deleteBoard maps a 404 to notFound", async () => {
  await withFetch(
    () => jsonResponse(404, { error: "Not found" }),
    async () => {
      const result = await deleteBoard("missing");

      assert.equal(result.ok, false);
      assert.equal(result.status, 404);
      assert.equal(result.error.kind, "notFound");
    }
  );
});

test("deleteBoard maps an expired session to unauthorized", async () => {
  await withFetch(
    () => jsonResponse(401, { error: "Not authenticated" }),
    async () => {
      const result = await deleteBoard("b1");

      assert.equal(result.ok, false);
      assert.equal(result.error.kind, "unauthorized");
    }
  );
});

test("deleteBoard reports a network error when fetch rejects", async () => {
  await withFetch(
    () => {
      throw new Error("offline");
    },
    async () => {
      const result = await deleteBoard("b1");

      assert.equal(result.ok, false);
      assert.equal(result.status, 0);
      assert.equal(result.error.kind, "network");
    }
  );
});
