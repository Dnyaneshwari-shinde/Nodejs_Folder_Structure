import type { ClientSession } from "mongodb";
import {
  createUser,
  findUserByEmail,
  isDuplicateUserEmailError,
} from "../repositories/user.repository.js";
import type { User } from "../models/user.model.js";
import { HttpError } from "./http-error.js";
import { hashPassword } from "./password.js";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async ({
  name,
  email,
  password,
}: RegisterUserInput, session?: ClientSession): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (await findUserByEmail(normalizedEmail, session)) {
    throw new HttpError(409, "A user with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    }, session);
  } catch (error) {
    if (isDuplicateUserEmailError(error)) {
      throw new HttpError(409, "A user with this email already exists.");
    }

    throw error;
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
};
