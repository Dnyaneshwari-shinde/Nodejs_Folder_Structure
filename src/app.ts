import express from "express";
import type { Express, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import authRoutes from "./routes/user.routes.js";
import { messages } from "./constants/messages.js";
import ApiError from "./utils/ApiError.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app: Express = express();

// Built-in middleware
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);

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

app.use((_req, _res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, messages.notFound));
});
app.use(errorMiddleware);

export default app;