import type { RequestHandler } from "express";
import type { z } from "zod";
import { HTTP_STATUS } from "../constants/http-status.js";

export const validateBody = (schema: z.ZodType): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid request body.",
        errors: result.error.issues.map(({ path, message }) => ({
          field: path.join("."),
          message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
};