export function createMemoryStore({ maxKeys = 10000 } = {}) {
  const map = new Map();

  return {
    get(key) {
      return map.get(key);
    },
    set(key, value) {
      if (map.has(key)) {
        map.delete(key);
      }
      map.set(key, value);

      if (map.size > maxKeys) {
        let overflow = map.size - maxKeys;
        for (const existingKey of map.keys()) {
          map.delete(existingKey);
          overflow -= 1;
          if (overflow <= 0) break;
        }
      }
    },
    delete(key) {
      map.delete(key);
    },
    size() {
      return map.size;
    },
  };
}

export function createRateLimiter({
  limit,
  windowMs,
  store = createMemoryStore(),
}) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("limit must be a positive integer");
  }
  if (!Number.isInteger(windowMs) || windowMs < 1) {
    throw new Error("windowMs must be a positive integer");
  }

  return {
    check(key, now = Date.now()) {
      const existing = store.get(key);

      if (!existing || now >= existing.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return {
          allowed: true,
          remaining: Math.max(0, limit - 1),
          retryAfterMs: 0,
        };
      }

      existing.count += 1;

      if (existing.count > limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, existing.resetAt - now),
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - existing.count),
        retryAfterMs: 0,
      };
    },

    reset(key) {
      store.delete(key);
    },
  };
}
