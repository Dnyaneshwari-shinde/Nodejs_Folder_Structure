import { createHash } from "node:crypto";
import type { ClientSession, Document } from "mongodb";
import { getDatabase, getMongoClient } from "../config/db.js";
import { HttpError } from "../utils/http-error.js";

export interface IdempotentResponse<T = unknown> {
  statusCode: number;
  body: T;
}

interface IdempotencyRecord extends Document {
  key: string;
  requestHash: string;
  response: IdempotentResponse;
  createdAt: Date;
}

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`).join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
};

const hashRequest = (request: unknown): string =>
  createHash("sha256").update(stableSerialize(request)).digest("hex");

const readStoredResponse = async (
  key: string,
  requestHash: string,
): Promise<IdempotentResponse | undefined> => {
  const existing = await getDatabase()
    .collection<IdempotencyRecord>("idempotency_keys")
    .findOne({ key });

  if (!existing) return undefined;
  if (existing.requestHash !== requestHash) {
    throw new HttpError(409, "This idempotency key was already used with different request data.");
  }

  return existing.response;
};

/** Executes an operation once per scoped key and atomically stores its response. */
export const executeIdempotently = async <T>(options: {
  key: string;
  scope: string;
  request: unknown;
  operation: (session: ClientSession) => Promise<IdempotentResponse<T>>;
}): Promise<IdempotentResponse<T>> => {
  const { key, scope, request, operation } = options;
  if (!key || key.length > 200) {
    throw new HttpError(400, "A valid Idempotency-Key header is required (maximum 200 characters).");
  }

  const scopedKey = `${scope}:${key}`;
  const requestHash = hashRequest(request);
  const previous = await readStoredResponse(scopedKey, requestHash);
  if (previous) return previous as IdempotentResponse<T>;

  let result: IdempotentResponse<T> | undefined;
  try {
    await getMongoClient().withSession(async (session) => {
      await session.withTransaction(async () => {
        const records = getDatabase().collection<IdempotencyRecord>("idempotency_keys");
        const existing = await records.findOne({ key: scopedKey }, { session });
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new HttpError(409, "This idempotency key was already used with different request data.");
          }
          result = existing.response as IdempotentResponse<T>;
          return;
        }

        const response = await operation(session);
        await records.insertOne({
          key: scopedKey,
          requestHash,
          response,
          createdAt: new Date(),
        }, { session });
        result = response;
      });
    });
  } catch (error) {
    // Concurrent requests may both pass the initial lookup. The unique index
    // lets one commit; the loser returns the winner's saved response.
    const committed = await readStoredResponse(scopedKey, requestHash);
    if (committed) return committed as IdempotentResponse<T>;
    throw error;
  }

  if (!result) throw new Error("Idempotent operation completed without a response.");
  return result;
};
