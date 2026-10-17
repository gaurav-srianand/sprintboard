import test from "node:test";
import assert from "node:assert/strict";

import connectDB from "../src/lib/mongodb.js";

function captureLogger() {
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

test("caches a successful connection and only connects once", async () => {
  globalThis._mongooseConn = null;
  const logger = captureLogger();
  let calls = 0;
  const connect = async () => {
    calls += 1;
    return { readyState: 1 };
  };

  const first = await connectDB({ uri: "mongodb://host/db", connect, logger });
  const second = await connectDB({ uri: "mongodb://host/db", connect, logger });

  assert.equal(calls, 1);
  assert.equal(first, second);
  assert.ok(logger.events.some((entry) => entry.event === "db.connect_start"));
  assert.ok(logger.events.some((entry) => entry.event === "db.connect_success"));
});

test("does not cache a rejected connection and retries on the next call", async () => {
  globalThis._mongooseConn = null;
  const logger = captureLogger();
  let calls = 0;
  const connect = async () => {
    calls += 1;
    throw new Error("connect ETIMEDOUT mongodb://user:pass@host:27017");
  };

  await assert.rejects(
    connectDB({ uri: "mongodb://host/db", connect, logger })
  );

  assert.equal(globalThis._mongooseConn, null);

  await assert.rejects(
    connectDB({ uri: "mongodb://host/db", connect, logger })
  );

  assert.equal(calls, 2);

  const failure = logger.events.find(
    (entry) => entry.event === "db.connect_failed"
  );
  assert.ok(failure);
  assert.ok(failure.errorMessage.includes("[redacted-uri]"));
  assert.ok(!failure.errorMessage.includes("pass"));
});

test("logs and throws when the connection string is missing", async () => {
  globalThis._mongooseConn = null;
  const logger = captureLogger();

  await assert.rejects(
    connectDB({ uri: "", connect: async () => ({}), logger }),
    /Missing MONGODB_URI/
  );

  const failure = logger.events.find(
    (entry) => entry.event === "db.connect_failed"
  );
  assert.ok(failure);
  assert.equal(failure.reason, "missing_uri");
});
