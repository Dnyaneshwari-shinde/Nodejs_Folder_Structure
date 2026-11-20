
import { closeDatabaseConnection, connectToDatabase } from "./config/db.js";
import { env, validateEnvironment } from "./config/env.js";
import app from "./app.js";

let server: Awaited<ReturnType<typeof startServer>>;
try {
  server = await startServer();
} catch (error) {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
  throw error;
}

async function startServer() {
  validateEnvironment();
  await connectToDatabase();
  console.log("Connected to MongoDB.");

  const httpServer = app.listen(env.port, () => {
    console.log(`Server is running at http://localhost:${env.port}`);
  });

  return httpServer;
}

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`${signal} received. Closing server...`);

  server.close((error?: Error) => {
    if (error) {
      console.error("Error while closing server:", error);
      process.exitCode = 1;
    } else {
      console.log("HTTP server closed.");
    }

    void closeDatabaseConnection()
      .then(() => console.log("MongoDB connection closed."))
      .catch((closeError: unknown) => {
        console.error("Error while closing MongoDB connection:", closeError);
        process.exitCode = 1;
      });
  });
};


process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));