import type { RequestHandler } from "express";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../constants/messages.js";
import { HTTP_STATUS } from "../constants/http-status.js";
import { registerUser as register } from "../utils/user.service.js";
import { executeIdempotently } from "../services/idempotency.service.js";
import {
  deleteUserById,
  findUserById,
  isDuplicateUserEmailError,
  updateUserById,
} from "../repositories/user.repository.js";
import type { UserRecord } from "../models/user.model.js";
import { HttpError } from "../utils/http-error.js";

const publicUser = ({ passwordHash: _passwordHash, ...user }: UserRecord) => user;

export const registerUser: RequestHandler = async (req, res) => {
  const result = await executeIdempotently({
    key: req.get("Idempotency-Key") ?? "",
    scope: "user-register",
    request: req.body,
    operation: async (session) => ({
      statusCode: HTTP_STATUS.CREATED,
      body: {
        success: true,
        message: SUCCESS_MESSAGES.USER_CREATED,
        data: await register(req.body, session),
      },
    }),
  });

  res.status(result.statusCode).json(result.body);
};

export const getUser: RequestHandler = async (req, res) => {
  const param = req.params.id;
  const id = Array.isArray(param) ? param[0] : param;
  if (!id) throw new HttpError(HTTP_STATUS.BAD_REQUEST, "User id is required.");
  const result = await executeIdempotently({
    key: req.get("Idempotency-Key") ?? "",
    scope: "user-read",
    request: { id },
    operation: async (session) => {
      const user = await findUserById(id, session);
      if (!user) throw new HttpError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      return {
        statusCode: HTTP_STATUS.OK,
        body: { success: true, message: SUCCESS_MESSAGES.USER_FETCHED, data: publicUser(user) },
      };
    },
  });

  res.status(result.statusCode).json(result.body);
};

export const updateUser: RequestHandler = async (req, res) => {
  const param = req.params.id;
  const id = Array.isArray(param) ? param[0] : param;
  if (!id) throw new HttpError(HTTP_STATUS.BAD_REQUEST, "User id is required.");
  const updates = req.body as { name?: string; email?: string };
  const result = await executeIdempotently({
    key: req.get("Idempotency-Key") ?? "",
    scope: "user-update",
    request: { id, updates },
    operation: async (session) => {
      let user: UserRecord | undefined;
      try {
        user = await updateUserById(id, {
          ...(updates.name === undefined ? {} : { name: updates.name.trim() }),
          ...(updates.email === undefined ? {} : { email: updates.email.trim().toLowerCase() }),
        }, session);
      } catch (error) {
        if (isDuplicateUserEmailError(error)) {
          throw new HttpError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.USER_EXISTS);
        }
        throw error;
      }

      if (!user) throw new HttpError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      return {
        statusCode: HTTP_STATUS.OK,
        body: { success: true, message: SUCCESS_MESSAGES.USER_UPDATED, data: publicUser(user) },
      };
    },
  });

  res.status(result.statusCode).json(result.body);
};

export const deleteUser: RequestHandler = async (req, res) => {
  const param = req.params.id;
  const id = Array.isArray(param) ? param[0] : param;
  if (!id) throw new HttpError(HTTP_STATUS.BAD_REQUEST, "User id is required.");
  const result = await executeIdempotently({
    key: req.get("Idempotency-Key") ?? "",
    scope: "user-delete",
    request: { id },
    operation: async (session) => {
      const deleted = await deleteUserById(id, session);
      if (!deleted) throw new HttpError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      return {
        statusCode: HTTP_STATUS.OK,
        body: { success: true, message: SUCCESS_MESSAGES.USER_DELETED },
      };
    },
  });

  res.status(result.statusCode).json(result.body);
};
