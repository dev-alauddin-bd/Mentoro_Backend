import { z } from "zod";

// ================= PASSWORD RULE =================
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[!@#$%^&*()_+\-=\\[\]{};':"|,.<>/?]/, "Must contain special character");

// ================= SIGNUP =================
export const signupSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: strongPassword,
  role: z.enum(["student", "instructor", "admin"]).default("student"),
});

// ================= LOGIN =================
export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

