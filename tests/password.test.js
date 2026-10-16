import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";

import { hashPassword } from "../src/lib/password.js";

test("hashes a password into a bcrypt hash that is not the plaintext", async () => {
  const hash = await hashPassword("secret123");

  assert.notEqual(hash, "secret123");
  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(await bcrypt.compare("secret123", hash), true);
  assert.equal(await bcrypt.compare("wrong-password", hash), false);
});

test("produces different hashes for the same password (unique salt)", async () => {
  const first = await hashPassword("secret123");
  const second = await hashPassword("secret123");

  assert.notEqual(first, second);
});
