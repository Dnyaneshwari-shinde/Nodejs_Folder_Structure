import { randomUUID } from "node:crypto";
import { MongoServerError, type ClientSession } from "mongodb";
import { getUserCollection } from "../config/db.js";
import type { UserRecord } from "../models/user.model.js";

export const findUserByEmail = async (
  email: string,
  session?: ClientSession,
): Promise<UserRecord | undefined> => {
  const document = await getUserCollection().findOne(
    { email },
    session ? { session } : {},
  );

  if (!document) {
    return undefined;
  }

  const { _id, ...user } = document;
  return { ...user, id: _id };
};

export const createUser = (
  user: Omit<UserRecord, "id" | "createdAt">,
  session?: ClientSession,
): Promise<UserRecord> => {
  const document = {
    _id: randomUUID(),
    ...user,
    createdAt: new Date(),
  };

  return getUserCollection()
    .insertOne(document, session ? { session } : {})
    .then(() => {
      const { _id, ...record } = document;
      return { ...record, id: _id };
    });
};

export const findUserById = async (
  id: string,
  session?: ClientSession,
): Promise<UserRecord | undefined> => {
  const document = await getUserCollection().findOne(
    { _id: id },
    session ? { session } : {},
  );
  if (!document) return undefined;

  const { _id, ...user } = document;
  return { ...user, id: _id };
};

export const updateUserById = async (
  id: string,
  updates: Partial<Pick<UserRecord, "name" | "email">>,
  session?: ClientSession,
): Promise<UserRecord | undefined> => {
  const result = await getUserCollection().updateOne(
    { _id: id },
    { $set: updates },
    session ? { session } : {},
  );
  if (result.matchedCount === 0) return undefined;
  return findUserById(id, session);
};

export const deleteUserById = async (
  id: string,
  session?: ClientSession,
): Promise<boolean> => {
  const result = await getUserCollection().deleteOne(
    { _id: id },
    session ? { session } : {},
  );
  return result.deletedCount > 0;
};

export const isDuplicateUserEmailError = (error: unknown): boolean =>
  error instanceof MongoServerError && error.code === 11000;
