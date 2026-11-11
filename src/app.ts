import express from "express";
import type { Express, Request, Response } from "express";
import userRouter from "./routes/user.routes.js";
import { API_ROUTES } from "./constants/routes.js";
import { HTTP_STATUS } from "./constants/http-status.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app: Express = express();

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(API_ROUTES.USERS, userRouter);

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

app.use((_req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: "Route not found.",
  });
});

app.use(errorHandler);

export default app;