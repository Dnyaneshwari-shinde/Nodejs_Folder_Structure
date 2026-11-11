// Validate registration, login, and profile input

import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must contain at least 2 characters")
  .max(50, "Name cannot exceed 50 characters");

const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .max(254, "Email cannot exceed 254 characters");

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(72, "Password cannot exceed 72 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

const passwordloginSchema = z
   .string()
   .min(1, "Password is required")
   .max(72, "Password is too long");

   
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one of name or email must be provided.",
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordloginSchema
});
