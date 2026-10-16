const GENERIC_ERROR = {
  kind: "server",
  message: "Something went wrong. Please try again.",
  fieldErrors: {},
};

export function mapBoardError(status, body) {
  const details =
    body && typeof body.details === "object" && body.details !== null
      ? body.details
      : {};

  if (status === 401) {
    return {
      kind: "unauthorized",
      message: "Your session has expired. Please sign in again.",
      fieldErrors: {},
    };
  }

  if (status === 400) {
    return {
      kind: "validation",
      message: (body && body.error) || "Please fix the highlighted fields.",
      fieldErrors: details,
    };
  }

  if (status === 404) {
    return {
      kind: "notFound",
      message: "This item no longer exists.",
      fieldErrors: {},
    };
  }

  return { ...GENERIC_ERROR };
}

async function request(url, { method = "GET", body } = {}) {
  const options = { method, headers: {} };

  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

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
      error: mapBoardError(response.status, data),
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

function boardUrl(boardId) {
  return `/api/boards/${encodeURIComponent(boardId)}`;
}

export function listBoards() {
  return request("/api/boards");
}

export function createBoard(input) {
  return request("/api/boards", { method: "POST", body: input });
}

export function getBoard(boardId) {
  return request(boardUrl(boardId));
}

export function updateBoard(boardId, input) {
  return request(boardUrl(boardId), { method: "PATCH", body: input });
}

export function deleteBoard(boardId) {
  return request(boardUrl(boardId), { method: "DELETE" });
}

export function listTasks(boardId) {
  return request(`${boardUrl(boardId)}/tasks`);
}

export function createTask(boardId, input) {
  return request(`${boardUrl(boardId)}/tasks`, { method: "POST", body: input });
}

export function updateTask(boardId, taskId, input) {
  return request(`${boardUrl(boardId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteTask(boardId, taskId) {
  return request(`${boardUrl(boardId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  });
}
