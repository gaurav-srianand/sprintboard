export const TASK_STATUSES = ["todo", "in_progress", "done"];
export const TASK_PRIORITIES = ["low", "medium", "high"];

export const BOARD_TITLE_MAX = 100;
export const BOARD_DESCRIPTION_MAX = 2000;
export const TASK_TITLE_MAX = 200;
export const TASK_DESCRIPTION_MAX = 5000;

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export function isValidObjectId(value) {
  return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

function asObject(body) {
  return body && typeof body === "object" ? body : {};
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasOwn(input, key) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

export function validateBoardCreate(body) {
  const input = asObject(body);
  const title = normalizeText(input.title);
  const description = normalizeText(input.description);
  const errors = {};

  if (!title) {
    errors.title = "Title is required";
  } else if (title.length > BOARD_TITLE_MAX) {
    errors.title = `Title must be at most ${BOARD_TITLE_MAX} characters`;
  }

  if (description.length > BOARD_DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${BOARD_DESCRIPTION_MAX} characters`;
  }

  const valid = Object.keys(errors).length === 0;

  return { valid, errors, data: valid ? { title, description } : null };
}

export function validateBoardUpdate(body) {
  const input = asObject(body);
  const errors = {};
  const data = {};

  const hasTitle = hasOwn(input, "title");
  const hasDescription = hasOwn(input, "description");

  if (hasTitle) {
    const title = normalizeText(input.title);
    if (!title) {
      errors.title = "Title is required";
    } else if (title.length > BOARD_TITLE_MAX) {
      errors.title = `Title must be at most ${BOARD_TITLE_MAX} characters`;
    } else {
      data.title = title;
    }
  }

  if (hasDescription) {
    const description = normalizeText(input.description);
    if (description.length > BOARD_DESCRIPTION_MAX) {
      errors.description = `Description must be at most ${BOARD_DESCRIPTION_MAX} characters`;
    } else {
      data.description = description;
    }
  }

  if (!hasTitle && !hasDescription) {
    errors.body = "Provide at least one field to update";
  }

  const valid = Object.keys(errors).length === 0;

  return { valid, errors, data: valid ? data : null };
}

export function validateTaskCreate(body) {
  const input = asObject(body);
  const title = normalizeText(input.title);
  const description = normalizeText(input.description);
  const errors = {};

  let status = "todo";
  let priority = "medium";

  if (!title) {
    errors.title = "Title is required";
  } else if (title.length > TASK_TITLE_MAX) {
    errors.title = `Title must be at most ${TASK_TITLE_MAX} characters`;
  }

  if (description.length > TASK_DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${TASK_DESCRIPTION_MAX} characters`;
  }

  if (hasOwn(input, "status")) {
    if (!TASK_STATUSES.includes(input.status)) {
      errors.status = `Status must be one of: ${TASK_STATUSES.join(", ")}`;
    } else {
      status = input.status;
    }
  }

  if (hasOwn(input, "priority")) {
    if (!TASK_PRIORITIES.includes(input.priority)) {
      errors.priority = `Priority must be one of: ${TASK_PRIORITIES.join(", ")}`;
    } else {
      priority = input.priority;
    }
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { title, description, status, priority } : null,
  };
}

export function validateTaskUpdate(body) {
  const input = asObject(body);
  const errors = {};
  const data = {};

  const updatable = ["title", "description", "status", "priority"];
  const provided = updatable.filter((field) => hasOwn(input, field));

  if (provided.length === 0) {
    errors.body = "Provide at least one field to update";
  }

  if (hasOwn(input, "title")) {
    const title = normalizeText(input.title);
    if (!title) {
      errors.title = "Title is required";
    } else if (title.length > TASK_TITLE_MAX) {
      errors.title = `Title must be at most ${TASK_TITLE_MAX} characters`;
    } else {
      data.title = title;
    }
  }

  if (hasOwn(input, "description")) {
    const description = normalizeText(input.description);
    if (description.length > TASK_DESCRIPTION_MAX) {
      errors.description = `Description must be at most ${TASK_DESCRIPTION_MAX} characters`;
    } else {
      data.description = description;
    }
  }

  if (hasOwn(input, "status")) {
    if (!TASK_STATUSES.includes(input.status)) {
      errors.status = `Status must be one of: ${TASK_STATUSES.join(", ")}`;
    } else {
      data.status = input.status;
    }
  }

  if (hasOwn(input, "priority")) {
    if (!TASK_PRIORITIES.includes(input.priority)) {
      errors.priority = `Priority must be one of: ${TASK_PRIORITIES.join(", ")}`;
    } else {
      data.priority = input.priority;
    }
  }

  const valid = Object.keys(errors).length === 0;

  return { valid, errors, data: valid ? data : null };
}
