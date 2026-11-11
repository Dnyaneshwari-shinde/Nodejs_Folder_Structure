import { MongoClient, type Collection, type Db, type Document } from "mongodb";
import type { UserRecord } from "../models/user.model.js";

type UserDocument = Document & Omit<UserRecord, "id"> & { _id: string };

let client: MongoClient | undefined;
let database: Db | undefined;

export const connectToDatabase = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required to start the application.");
  }

  const mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });

  try {
    await mongoClient.connect();
    const connectedDatabase = mongoClient.db();

    await connectedDatabase
      .collection<UserDocument>("users")
      .createIndex({ email: 1 }, { unique: true, name: "unique_user_email" });

    await connectedDatabase
      .collection("idempotency_keys")
      .createIndex({ key: 1 }, { unique: true, name: "unique_idempotency_key" });

    client = mongoClient;
    database = connectedDatabase;
    console.info("Connected to MongoDB.");
  } catch (error) {
    try {
      await mongoClient.close();
    } catch (closeError) {
      console.error("Failed to close MongoDB client after connection failure:", closeError);
    }

    throw error;
  }
};

export const getUserCollection = (): Collection<UserDocument> => {
  if (!database) {
    throw new Error("MongoDB is not connected.");
  }

  return database.collection<UserDocument>("users");
};

export const getDatabase = (): Db => {
  if (!database) {
    throw new Error("MongoDB is not connected.");
  }

  return database;
};

export const getMongoClient = (): MongoClient => {
  if (!client) {
    throw new Error("MongoDB is not connected.");
  }

  return client;
};

export const disconnectFromDatabase = async (): Promise<void> => {
  const connectedClient = client;
  client = undefined;
  database = undefined;

  await connectedClient?.close();
};
