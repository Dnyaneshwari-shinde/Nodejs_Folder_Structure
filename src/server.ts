import app from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`${signal} received. Closing server...`);

  server.close((error?: Error) => {
    if (error) {
      console.error("Error while closing server:", error);
      process.exitCode = 1;
      return;
    }

    console.log("HTTP server closed.");
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));