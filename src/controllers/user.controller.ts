// Handle HTTP requests and responses for users

import { StatusCodes } from "http-status-codes";
import type { RequestHandler } from "express";
import { messages } from "../constants/messages.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { authService } from "../services/user.service.js";

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(messages.userRegistered, result));
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(messages.userLoggedIn, result));
});
