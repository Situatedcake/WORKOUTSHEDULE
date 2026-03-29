import { createServerApp } from "./app.js";
import { serverConfig } from "./config.js";
import { initializeMySqlPool } from "./db/mysqlPool.js";
import { jsonUserRepository } from "./repositories/jsonUserRepository.js";
import { mysqlUserRepository } from "./repositories/mysqlUserRepository.js";

function formatStartupError(error) {
  const connectionLabel = `${serverConfig.mysql.host}:${serverConfig.mysql.port}`;

  if (error?.code === "ECONNREFUSED") {
    return [
      `MySQL is not accepting connections on ${connectionLabel}.`,
      "Check that the MySQL service is running and that MYSQL_HOST / MYSQL_PORT are correct in .env.",
    ].join("\n");
  }

  if (error?.code === "ER_ACCESS_DENIED_ERROR") {
    return [
      "MySQL rejected the username or password.",
      "Check MYSQL_USER and MYSQL_PASSWORD in .env.",
    ].join("\n");
  }

  if (error?.code === "ER_BAD_DB_ERROR") {
    return [
      `The database "${serverConfig.mysql.database}" is unavailable.`,
      "Check MYSQL_DATABASE in .env and verify the MySQL user can create databases.",
    ].join("\n");
  }

  return error instanceof Error ? error.stack ?? error.message : String(error);
}

async function resolveUserRepository() {
  if (serverConfig.databaseProvider === "json") {
    console.warn("MySQL is disabled. The API will use JSON storage.");
    return {
      databaseProvider: "json",
      userRepository: jsonUserRepository,
    };
  }

  try {
    await initializeMySqlPool();

    return {
      databaseProvider: "mysql",
      userRepository: mysqlUserRepository,
    };
  } catch (error) {
    if (serverConfig.databaseProvider === "mysql") {
      throw error;
    }

    console.warn(formatStartupError(error));
    console.warn("Falling back to JSON storage in src/data/mockDatabase.json.");

    return {
      databaseProvider: "json",
      userRepository: jsonUserRepository,
    };
  }
}

async function startServer() {
  const { databaseProvider, userRepository } = await resolveUserRepository();
  const app = createServerApp({ userRepository, databaseProvider });
  app.listen(serverConfig.apiPort, () => {
    console.log(
      `API is running on http://localhost:${serverConfig.apiPort} using ${databaseProvider} storage`,
    );
  });
}

startServer().catch((error) => {
  console.error("Failed to start MySQL API:");
  console.error(formatStartupError(error));
  process.exit(1);
});
