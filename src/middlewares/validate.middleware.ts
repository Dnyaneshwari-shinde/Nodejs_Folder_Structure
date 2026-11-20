import { StatusCodes } from "http-status-codes";
import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { messages } from "../constants/messages.js";
import ApiError from "../utils/ApiError.js";

export default function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          messages.validationFailed,
          result.error.issues.map((issue) => ({
            field: issue.path.length > 0 ? issue.path.join(".") : "body",
            message: issue.message,
          })),
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}