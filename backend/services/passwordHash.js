import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 10;

function normalizePasswordValue(password) {
  return String(password ?? "");
}

export function isPasswordHash(password) {
  return /^\$2[aby]\$\d{2}\$/.test(String(password ?? ""));
}

export async function hashPassword(password) {
  return bcrypt.hash(normalizePasswordValue(password), BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(storedPassword, inputPassword) {
  const normalizedStoredPassword = normalizePasswordValue(storedPassword);
  const normalizedInputPassword = normalizePasswordValue(inputPassword);

  if (!normalizedStoredPassword) {
    return false;
  }

  if (!isPasswordHash(normalizedStoredPassword)) {
    return normalizedStoredPassword === normalizedInputPassword;
  }

  return bcrypt.compare(normalizedInputPassword, normalizedStoredPassword);
}
