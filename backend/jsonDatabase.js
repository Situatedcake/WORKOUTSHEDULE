import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const databaseFilePath = path.resolve(
  process.cwd(),
  "src",
  "data",
  "mockDatabase.json",
);

const defaultDatabase = {
  users: [],
};

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

async function ensureDatabaseFile() {
  await mkdir(path.dirname(databaseFilePath), { recursive: true });

  try {
    await readFile(databaseFilePath, "utf-8");
  } catch {
    await writeFile(
      databaseFilePath,
      JSON.stringify(defaultDatabase, null, 2),
      "utf-8",
    );
  }
}

export async function readDatabase() {
  await ensureDatabaseFile();

  try {
    const rawDatabase = await readFile(databaseFilePath, "utf-8");
    const parsedDatabase = JSON.parse(rawDatabase);

    return {
      users: Array.isArray(parsedDatabase.users) ? parsedDatabase.users : [],
    };
  } catch {
    return cloneValue(defaultDatabase);
  }
}

export async function writeDatabase(database) {
  const normalizedDatabase = {
    users: Array.isArray(database.users) ? database.users : [],
  };

  await ensureDatabaseFile();
  await writeFile(
    databaseFilePath,
    JSON.stringify(normalizedDatabase, null, 2),
    "utf-8",
  );

  return cloneValue(normalizedDatabase);
}

export function normalizeUserName(name) {
  return name.trim().toLowerCase();
}

export function createUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password: _password, ...publicUser } = user;
  return cloneValue(publicUser);
}
