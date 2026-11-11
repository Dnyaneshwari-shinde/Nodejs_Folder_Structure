import { randomBytes, scrypt as scryptCallback } from "node:crypto";

const deriveKey = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);

  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
};