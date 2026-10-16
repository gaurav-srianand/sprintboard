export const DEFAULT_REDIRECT = "/dashboard";

export function safeNextPath(value, fallback = DEFAULT_REDIRECT) {
  if (typeof value !== "string") {
    return fallback;
  }

  const candidate = value.trim();
  if (!candidate) {
    return fallback;
  }

  if (!candidate.startsWith("/")) {
    return fallback;
  }

  if (candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return fallback;
  }

  if (candidate.includes("\\")) {
    return fallback;
  }

  if (candidate.includes("://")) {
    return fallback;
  }

  if (/[\u0000-\u001f\u007f]/.test(candidate)) {
    return fallback;
  }

  return candidate;
}

export default safeNextPath;
