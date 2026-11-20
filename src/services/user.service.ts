// Implement user registration, login, and profile business logic


import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { messages } from "../constants/messages.js";
import type { UserDocument } from "../models/user.model.js";
import userRepository, { type UserRepository } from "../repositories/user.repository.js";
import type { LoginInput, RegisterInput } from "../validators/user.validator.js";
import ApiError from "../utils/ApiError.js";
import generateToken from "../utils/generateToken.js";

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

function toAuthResult(user: UserDocument): AuthResult {
  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    token: generateToken(user._id.toString()),
  };
}

function isDuplicateEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export class AuthService {
  constructor(private readonly repository: UserRepository = userRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    if (await this.repository.findByEmail(input.email)) {
      throw new ApiError(StatusCodes.CONFLICT, messages.emailAlreadyExists);
    }

    const password = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    try {
      const user = await this.repository.create({
        name: input.name,
        email: input.email,
        password,
      });
      return toAuthResult(user);
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        throw new ApiError(StatusCodes.CONFLICT, messages.emailAlreadyExists);
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.repository.findByEmail(input.email, true);
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, messages.invalidCredentials);
    }

    return toAuthResult(user);
  }
}

export const authService = new AuthService();
