import "dotenv/config";

// Read and validate environment variables
export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV,
  mongodbUri: process.env.MONGODB_URI,
  mongodbDatabase: process.env.MONGODB_DATABASE || "auth_db",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  bcryptSaltRounds:
    process.env.BCRYPT_SALT_ROUNDS === undefined
      ? 12
      : Number(process.env.BCRYPT_SALT_ROUNDS),
};

export function validateEnvironment(): void {
  if (!env.mongodbUri) {
    throw new Error(
      "MONGODB_URI is missing. Create a .env file from .env.example and set your MongoDB connection string.",
    );
  }

  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must be set to a random value of at least 32 characters.",
    );
  }

  if (!/^[1-9]\d*(?:s|m|h|d|w|y)$/i.test(env.jwtExpiresIn)) {
    throw new Error("JWT_EXPIRES_IN must be a duration such as 15m or 1d.");
  }

  if (
    !Number.isInteger(env.bcryptSaltRounds) ||
    env.bcryptSaltRounds < 4 ||
    env.bcryptSaltRounds > 31
  ) {
    throw new Error("BCRYPT_SALT_ROUNDS must be an integer between 4 and 31.");
  }
}