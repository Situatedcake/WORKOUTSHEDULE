import {
  createUserId,
  normalizeUserName,
  readDatabase,
  sanitizeUser,
  writeDatabase,
} from "./jsonDatabase.js";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function parseRequestBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;
    });

    request.on("end", () => {
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

async function handleApiRequest(request, response) {
  const url = new URL(request.url, "http://localhost");
  const userIdMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  const trainingResultMatch = url.pathname.match(
    /^\/api\/users\/([^/]+)\/training-result$/,
  );

  if (request.method === "GET" && url.pathname === "/api/users") {
    const name = url.searchParams.get("name");

    if (!name) {
      sendJson(response, 400, { message: "Query param 'name' is required." });
      return;
    }

    const database = await readDatabase();
    const user = database.users.find(
      (item) => normalizeUserName(item.name) === normalizeUserName(name),
    );

    sendJson(response, 200, { user: user ? sanitizeUser(user) : null });
    return;
  }

  if (request.method === "GET" && userIdMatch) {
    const userId = userIdMatch[1];
    const database = await readDatabase();
    const user = database.users.find((item) => item.id === userId);

    if (!user) {
      sendJson(response, 404, { message: "User not found." });
      return;
    }

    sendJson(response, 200, { user: sanitizeUser(user) });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/users") {
    const body = await parseRequestBody(request);
    const database = await readDatabase();
    const timestamp = new Date().toISOString();

    const nextUser = {
      id: createUserId(),
      name: String(body.name ?? "").trim(),
      password: String(body.password ?? ""),
      trainingLevel: "Не определен",
      lastTestScore: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    database.users.push(nextUser);
    await writeDatabase(database);

    sendJson(response, 201, { user: sanitizeUser(nextUser) });
    return;
  }

  if (request.method === "PATCH" && trainingResultMatch) {
    const userId = trainingResultMatch[1];
    const body = await parseRequestBody(request);
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      sendJson(response, 404, { message: "User not found." });
      return;
    }

    const currentUser = database.users[userIndex];
    const updatedUser = {
      ...currentUser,
      trainingLevel: body.trainingLevel,
      lastTestScore: body.score,
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = updatedUser;
    await writeDatabase(database);

    sendJson(response, 200, { user: sanitizeUser(updatedUser) });
    return;
  }

  sendJson(response, 404, { message: "API route not found." });
}

function createMiddleware() {
  return async (request, response, next) => {
    if (!request.url?.startsWith("/api/")) {
      next();
      return;
    }

    try {
      await handleApiRequest(request, response);
    } catch (error) {
      sendJson(response, 500, {
        message:
          error instanceof Error ? error.message : "Unexpected server error.",
      });
    }
  };
}

export function mockDatabaseApiPlugin() {
  return {
    name: "mock-database-api-plugin",
    configureServer(server) {
      server.middlewares.use(createMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware());
    },
  };
}
