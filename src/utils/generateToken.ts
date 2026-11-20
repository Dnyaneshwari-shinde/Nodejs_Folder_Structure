import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export default function generateToken(userId: string): string {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
  }

  const duration = /^(\d+)(s|m|h|d|w|y)$/i.exec(env.jwtExpiresIn);
  if (!duration) {
    throw new Error("JWT_EXPIRES_IN must be a duration such as 15m or 1d.");
  }

  const amountText = duration[1];
  const unit = duration[2]?.toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7,
    y: 60 * 60 * 24 * 365,
  };
  const multiplier = unit ? multipliers[unit] : undefined;
  const seconds = Number(amountText) * (multiplier ?? 0);
  if (!amountText || !multiplier || !Number.isSafeInteger(seconds) || seconds < 1) {
    throw new Error("JWT_EXPIRES_IN must be a positive, safe duration.");
  }

  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: seconds,
  });
}
