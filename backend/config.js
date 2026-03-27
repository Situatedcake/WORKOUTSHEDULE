import dotenv from "dotenv";

dotenv.config();

export const serverConfig = {
  apiPort: Number(process.env.API_PORT ?? 3001),
  databaseProvider: process.env.SERVER_DB_PROVIDER ?? "auto",
  mysql: {
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE ?? "workoutshedule",
  },
};
