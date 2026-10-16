import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryStore,
  createRateLimiter,
} from "../src/lib/rateLimit.js";

test("allows up to the limit, then blocks with a retry hint", () => {
  const limiter = createRateLimiter({
    limit: 3,
    windowMs: 1000,
    store: createMemoryStore(),
  });

  assert.equal(limiter.check("k", 1000).allowed, true);
  assert.equal(limiter.check("k", 1000).allowed, true);
  assert.equal(limiter.check("k", 1000).allowed, true);

  const fourth = limiter.check("k", 1000);
  assert.equal(fourth.allowed, false);
  assert.equal(fourth.remaining, 0);
  assert.equal(fourth.retryAfterMs, 1000);
});

test("remaining counts down as attempts are used", () => {
  const limiter = createRateLimiter({
    limit: 2,
    windowMs: 5000,
    store: createMemoryStore(),
  });

  assert.equal(limiter.check("k", 0).remaining, 1);
  assert.equal(limiter.check("k", 0).remaining, 0);
});

test("the window resets once windowMs has elapsed", () => {
  const limiter = createRateLimiter({
    limit: 1,
    windowMs: 1000,
    store: createMemoryStore(),
  });

  assert.equal(limiter.check("k", 0).allowed, true);
  assert.equal(limiter.check("k", 999).allowed, false);
  assert.equal(limiter.check("k", 1000).allowed, true);
});

test("keys are tracked independently", () => {
  const limiter = createRateLimiter({
    limit: 1,
    windowMs: 1000,
    store: createMemoryStore(),
  });

  assert.equal(limiter.check("a", 0).allowed, true);
  assert.equal(limiter.check("b", 0).allowed, true);
  assert.equal(limiter.check("a", 0).allowed, false);
});

test("reset clears a single key", () => {
  const limiter = createRateLimiter({
    limit: 1,
    windowMs: 1000,
    store: createMemoryStore(),
  });

  limiter.check("k", 0);
  limiter.reset("k");
  assert.equal(limiter.check("k", 0).allowed, true);
});

test("memory store evicts the oldest keys past maxKeys", () => {
  const store = createMemoryStore({ maxKeys: 2 });

  store.set("a", {});
  store.set("b", {});
  store.set("c", {});

  assert.equal(store.size(), 2);
  assert.equal(store.get("a"), undefined);
  assert.notEqual(store.get("b"), undefined);
  assert.notEqual(store.get("c"), undefined);
});

test("rejects invalid configuration", () => {
  assert.throws(() => createRateLimiter({ limit: 0, windowMs: 1000 }));
  assert.throws(() => createRateLimiter({ limit: 1, windowMs: 0 }));
  assert.throws(() => createRateLimiter({ limit: 1.5, windowMs: 1000 }));
});
