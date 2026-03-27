import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { serverConfig } from "../config.js";

let pool = null;

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: serverConfig.mysql.host,
    port: serverConfig.mysql.port,
    user: serverConfig.mysql.user,
    password: serverConfig.mysql.password,
    multipleStatements: true,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${serverConfig.mysql.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );

  await connection.end();
}

async function ensureSchema() {
  const schemaPath = path.resolve(process.cwd(), "sql", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf-8");
  await pool.query(schemaSql);
}

export async function initializeMySqlPool() {
  if (pool) {
    return pool;
  }

  await ensureDatabaseExists();

  pool = mysql.createPool({
    host: serverConfig.mysql.host,
    port: serverConfig.mysql.port,
    user: serverConfig.mysql.user,
    password: serverConfig.mysql.password,
    database: serverConfig.mysql.database,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    multipleStatements: true,
  });

  await ensureSchema();

  return pool;
}

export function getMySqlPool() {
  if (!pool) {
    throw new Error("MySQL pool is not initialized.");
  }

  return pool;
}
