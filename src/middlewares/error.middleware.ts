import { StatusCodes } from "http-status-codes";
import type { ErrorRequestHandler } from "express";
import { messages } from "../constants/messages.js";
import ApiError from "../utils/ApiError.js";

const errorMiddleware: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === StatusCodes.BAD_REQUEST
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: messages.validationFailed,
      errors: [{ field: "body", message: "Request body must contain valid JSON." }],
    });
    return;
  }

  console.error("Unhandled request error:", error);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: messages.internalServerError,
    errors: [],
  });
};

export default errorMiddleware;