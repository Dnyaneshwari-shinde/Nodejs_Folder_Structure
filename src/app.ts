import express from "express";
import type { Express, Request, Response } from "express";

const app: Express = express();

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health-check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Node.js TypeScript API",
  });
});

export default app;