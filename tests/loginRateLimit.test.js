import test from "node:test";
import assert from "node:assert/strict";

import { createLoginRateLimit } from "../src/lib/auth/loginRateLimit.js";

function makeLimiter(overrides = {}) {
  return createLoginRateLimit({
    ipLimit: 3,
    emailLimit: 2,
    windowMs: 1000,
    ...overrides,
  });
}

test("allows attempts that are under both limits", () => {
  const rl = makeLimiter();
  assert.deepEqual(rl.check({ ip: "1.1.1.1", email: "a@b.com" }), { ok: true });
});

test("blocks after the per-email limit, even from different IPs", () => {
  const rl = makeLimiter();

  assert.equal(rl.check({ ip: "1", email: "a@b.com" }).ok, true);
  assert.equal(rl.check({ ip: "2", email: "a@b.com" }).ok, true);

  const third = rl.check({ ip: "3", email: "a@b.com" });
  assert.equal(third.ok, false);
  assert.equal(third.scope, "email");
  assert.equal(third.status, 429);
  assert.ok(third.retryAfterMs > 0);
});

test("blocks after the per-IP limit, across different emails", () => {
  const rl = makeLimiter();

  assert.equal(rl.check({ ip: "1", email: "a@b.com" }).ok, true);
  assert.equal(rl.check({ ip: "1", email: "b@b.com" }).ok, true);
  assert.equal(rl.check({ ip: "1", email: "c@b.com" }).ok, true);

  const fourth = rl.check({ ip: "1", email: "d@b.com" });
  assert.equal(fourth.ok, false);
  assert.equal(fourth.scope, "ip");
});

test("distinct IPs and emails do not interfere", () => {
  const rl = makeLimiter();
  assert.equal(rl.check({ ip: "1", email: "a@b.com" }).ok, true);
  assert.equal(rl.check({ ip: "2", email: "b@b.com" }).ok, true);
});

test("skips the email limiter when no email is supplied", () => {
  const rl = makeLimiter();

  assert.equal(rl.check({ ip: "1", email: "" }).ok, true);
  assert.equal(rl.check({ ip: "1", email: "" }).ok, true);
  assert.equal(rl.check({ ip: "1", email: "" }).ok, true);
});

test("reset clears both the IP and email counters", () => {
  const rl = makeLimiter();

  rl.check({ ip: "1", email: "a@b.com" });
  rl.check({ ip: "1", email: "a@b.com" });
  assert.equal(rl.check({ ip: "1", email: "a@b.com" }).ok, false);

  rl.reset({ ip: "1", email: "a@b.com" });
  assert.equal(rl.check({ ip: "1", email: "a@b.com" }).ok, true);
});
