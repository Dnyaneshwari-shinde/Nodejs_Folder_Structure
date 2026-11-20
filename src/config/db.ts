import mongoose from "mongoose";
import { env } from "./env.js";
import { setServers } from "node:dns";

// Configure DNS before MongoDB connection
setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!env.mongodbUri) {
    throw new Error(
      "MONGODB_URI is missing. Create a .env file from .env.example and set your MongoDB connection string.",
    );
  }

  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDatabase,
  });

  const database = mongoose.connection.db;
  if (!database) {
    throw new Error("MongoDB connected without an active database handle.");
  }
  await database.admin().ping();

  return mongoose;
}

export async function closeDatabaseConnection(): Promise<void> {
  await mongoose.disconnect();
}
