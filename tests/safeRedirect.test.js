import test from "node:test";
import assert from "node:assert/strict";

import { safeNextPath, DEFAULT_REDIRECT } from "../src/lib/safeRedirect.js";

test("accepts simple same-origin relative paths", () => {
  assert.equal(safeNextPath("/dashboard"), "/dashboard");
  assert.equal(safeNextPath("/boards/123"), "/boards/123");
  assert.equal(safeNextPath("/settings?tab=profile"), "/settings?tab=profile");
  assert.equal(safeNextPath("/a/b#section"), "/a/b#section");
});

test("trims surrounding whitespace on valid paths", () => {
  assert.equal(safeNextPath("  /dashboard  "), "/dashboard");
});

test("rejects absolute URLs", () => {
  assert.equal(safeNextPath("https://evil.com"), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("http://evil.com/path"), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("HTTPS://evil.com"), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("javascript:alert(1)"), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("mailto:someone@example.com"), DEFAULT_REDIRECT);
});

test("rejects protocol-relative URLs", () => {
  assert.equal(safeNextPath("//evil.com"), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("//evil.com/path"), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("/\\evil.com"), DEFAULT_REDIRECT);
});

test("rejects paths containing a scheme separator", () => {
  assert.equal(safeNextPath("/redirect?url=https://evil.com"), DEFAULT_REDIRECT);
});

test("rejects backslashes anywhere in the path", () => {
  assert.equal(safeNextPath("/foo\\bar"), DEFAULT_REDIRECT);
});

test("rejects control characters", () => {
  assert.equal(safeNextPath("/foo\nbar"), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("/foo\rbar"), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("/foo\u0000bar"), DEFAULT_REDIRECT);
});

test("rejects malformed and empty inputs", () => {
  assert.equal(safeNextPath(null), DEFAULT_REDIRECT);
  assert.equal(safeNextPath(undefined), DEFAULT_REDIRECT);
  assert.equal(safeNextPath(42), DEFAULT_REDIRECT);
  assert.equal(safeNextPath({}), DEFAULT_REDIRECT);
  assert.equal(safeNextPath(""), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("   "), DEFAULT_REDIRECT);
  assert.equal(safeNextPath("dashboard"), DEFAULT_REDIRECT);
});

test("uses a custom fallback when provided", () => {
  assert.equal(safeNextPath(null, "/login"), "/login");
  assert.equal(safeNextPath("https://evil.com", "/home"), "/home");
});
