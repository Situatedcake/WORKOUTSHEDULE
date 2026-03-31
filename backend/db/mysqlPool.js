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

async function hasUsersColumn(columnName) {
  const [rows] = await pool.execute(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [serverConfig.mysql.database, columnName],
  );

  return rows.length > 0;
}

async function hasUsersIndex(indexName) {
  const [rows] = await pool.execute(
    `
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [serverConfig.mysql.database, indexName],
  );

  return rows.length > 0;
}

async function ensureUsersTableCompatibility() {
  const hasLoginColumn = await hasUsersColumn("login");

  if (!hasLoginColumn) {
    await pool.query(
      "ALTER TABLE users ADD COLUMN login VARCHAR(100) NULL AFTER id",
    );
  }

  await pool.query(`
    UPDATE users
    SET login = name
    WHERE login IS NULL OR login = ''
  `);

  await pool.query(
    "ALTER TABLE users MODIFY COLUMN login VARCHAR(100) NOT NULL",
  );

  const hasLoginIndex = await hasUsersIndex("users_login_unique");

  if (!hasLoginIndex) {
    await pool.query(
      "ALTER TABLE users ADD UNIQUE INDEX users_login_unique (login)",
    );
  }

  const hasTrainingPlanAdaptationHistoryColumn = await hasUsersColumn(
    "training_plan_adaptation_history_json",
  );

  if (!hasTrainingPlanAdaptationHistoryColumn) {
    await pool.query(
      "ALTER TABLE users ADD COLUMN training_plan_adaptation_history_json LONGTEXT NULL AFTER training_plan_json",
    );
  }

  const hasTrainingMlFeedbackHistoryColumn = await hasUsersColumn(
    "training_ml_feedback_history_json",
  );

  if (!hasTrainingMlFeedbackHistoryColumn) {
    await pool.query(
      "ALTER TABLE users ADD COLUMN training_ml_feedback_history_json LONGTEXT NULL AFTER training_plan_adaptation_history_json",
    );
  }

  const hasGenderColumn = await hasUsersColumn("gender");

  if (!hasGenderColumn) {
    await pool.query(
      "ALTER TABLE users ADD COLUMN gender VARCHAR(32) NOT NULL DEFAULT 'not_specified' AFTER email",
    );
  }

  await pool.query(`
    UPDATE users
    SET gender = 'not_specified'
    WHERE gender IS NULL OR gender = ''
  `);
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
  await ensureUsersTableCompatibility();

  return pool;
}

export function getMySqlPool() {
  if (!pool) {
    throw new Error("MySQL pool is not initialized.");
  }

  return pool;
}
