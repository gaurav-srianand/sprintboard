import { createMemoryStore, createRateLimiter } from "../rateLimit.js";

export const LOGIN_IP_LIMIT = 20;
export const LOGIN_EMAIL_LIMIT = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const IP_PREFIX = "login:ip:";
const EMAIL_PREFIX = "login:email:";

export function createLoginRateLimit({
  store = createMemoryStore(),
  ipLimit = LOGIN_IP_LIMIT,
  emailLimit = LOGIN_EMAIL_LIMIT,
  windowMs = LOGIN_WINDOW_MS,
} = {}) {
  const ipLimiter = createRateLimiter({ limit: ipLimit, windowMs, store });
  const emailLimiter = createRateLimiter({ limit: emailLimit, windowMs, store });

  return {
    check({ ip, email }) {
      const ipResult = ipLimiter.check(`${IP_PREFIX}${ip || "unknown"}`);
      if (!ipResult.allowed) {
        return {
          ok: false,
          scope: "ip",
          status: 429,
          retryAfterMs: ipResult.retryAfterMs,
        };
      }

      if (email) {
        const emailResult = emailLimiter.check(`${EMAIL_PREFIX}${email}`);
        if (!emailResult.allowed) {
          return {
            ok: false,
            scope: "email",
            status: 429,
            retryAfterMs: emailResult.retryAfterMs,
          };
        }
      }

      return { ok: true };
    },

    reset({ ip, email }) {
      ipLimiter.reset(`${IP_PREFIX}${ip || "unknown"}`);
      if (email) {
        emailLimiter.reset(`${EMAIL_PREFIX}${email}`);
      }
    },
  };
}

export const loginRateLimit = createLoginRateLimit();
