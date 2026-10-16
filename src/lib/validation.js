const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function validateRegistration(body) {
  const input = body && typeof body === "object" ? body : {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = normalizeEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";

  const errors = {};

  if (!name) {
    errors.name = "Name is required";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Invalid email format";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    errors.password = `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { name, email, password } : null,
  };
}

export function validateLogin(body) {
  const input = body && typeof body === "object" ? body : {};

  const email = normalizeEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";

  const errors = {};

  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Invalid email format";
  }

  if (!password) {
    errors.password = "Password is required";
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { email, password } : null,
  };
}
