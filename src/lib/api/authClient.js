export function mapAuthError(status, body, retryAfterSeconds = null) {
  const fieldErrors =
    body && typeof body.details === "object" && body.details !== null
      ? body.details
      : {};

  if (status === 400) {
    return {
      kind: "validation",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (status === 401) {
    return {
      kind: "invalid",
      message: "Invalid email or password.",
      fieldErrors: {},
    };
  }

  if (status === 409) {
    return {
      kind: "duplicate",
      message: "An account with that email already exists.",
      fieldErrors: { email: "This email is already registered." },
    };
  }

  if (status === 429) {
    const base = "Too many attempts. Please try again";
    const message =
      retryAfterSeconds && retryAfterSeconds > 0
        ? `${base} in ${retryAfterSeconds}s.`
        : `${base} later.`;
    return {
      kind: "rateLimited",
      message,
      fieldErrors: {},
      retryAfterSeconds: retryAfterSeconds || null,
    };
  }

  return {
    kind: "server",
    message: "Something went wrong. Please try again.",
    fieldErrors: {},
  };
}

function parseRetryAfter(response) {
  const header = response.headers.get("retry-after");
  if (!header) {
    return null;
  }
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

async function postJson(url, body) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.ok) {
      return { ok: true, status: response.status, data };
    }

    return {
      ok: false,
      status: response.status,
      error: mapAuthError(
        response.status,
        data,
        parseRetryAfter(response)
      ),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: {
        kind: "network",
        message: "Network error. Please check your connection and try again.",
        fieldErrors: {},
      },
    };
  }
}

export function loginRequest(credentials) {
  return postJson("/api/auth/login", credentials);
}

export function registerRequest(account) {
  return postJson("/api/auth/register", account);
}

export async function logoutRequest() {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function fetchMe() {
  try {
    const response = await fetch("/api/auth/me", { method: "GET" });
    if (!response.ok) {
      return { ok: false, status: response.status, user: null };
    }
    const data = await response.json();
    return { ok: true, status: response.status, user: data.user };
  } catch {
    return { ok: false, status: 0, user: null };
  }
}
