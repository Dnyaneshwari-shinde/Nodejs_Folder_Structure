// Validate registration, login, and profile input

import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/\d/, "Password must contain a number.")
  .regex(/[^A-Za-z0-9\s]/, "Password must contain a special character.");

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long.")
      .max(100, "Name must be at most 100 characters long."),
    email: z
      .string()
      .trim()
      .max(254, "Email must be at most 254 characters long.")
      .email("Enter a valid email address.")
      .transform((email) => email.toLowerCase()),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .transform((email) => email.toLowerCase()),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
