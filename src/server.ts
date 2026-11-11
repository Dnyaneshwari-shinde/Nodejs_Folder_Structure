import "dotenv/config";
import app from "./app.js";
import { connectToDatabase, disconnectFromDatabase } from "./config/db.js";

const PORT = Number(process.env.PORT) || 3000;

const startServer = async (): Promise<void> => {
  await connectToDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`${signal} received. Closing server...`);

    server.close(async (error?: Error) => {
      if (error) {
        console.error("Error while closing server:", error);
        process.exitCode = 1;
      }

      try {
        await disconnectFromDatabase();
        console.log("HTTP server and MongoDB connection closed.");
      } catch (closeError) {
        console.error("Error while closing MongoDB connection:", closeError);
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((error: unknown) => {
  console.error("Failed to start the API:", error);
  process.exitCode = 1;
});