import { z } from "zod";

export const updateProfileValidation = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long").optional(),
  bio: z.string().trim().max(500, "Bio is too long").optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s\-().]{7,20}$/, "Invalid phone number")
    .optional(),
  website: z.string().url("Website must be a valid URL").optional(),
});

export const updateUserRoleValidation = z.object({
  role: z.enum(["student", "instructor", "admin"], {
    message: "Role must be one of: student, instructor, admin",
  }),
});

export const updateUserStatusValidation = z.object({
  status: z.enum(["active", "blocked"], {
    message: "Status must be one of: active, blocked",
  }),
});
