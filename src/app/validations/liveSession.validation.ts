import { z } from "zod";

export const createLiveSessionValidation = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000).optional(),
  thumbnail: z.string().optional(),
  sessionDate: z.string().datetime({ message: "Invalid session date format (ISO 8601 required)" }),
  registrationDeadline: z.string().datetime({ message: "Invalid deadline format (ISO 8601 required)" }),
  maxCapacity: z.number().int().min(1).optional(),
  meetingLink: z.string().url("Meeting URL must be a valid URL").optional(),
  isPublished: z.boolean().optional(),
});

export const updateLiveSessionValidation = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  thumbnail: z.string().optional(),
  sessionDate: z.string().datetime({ message: "Invalid session date format" }).optional(),
  registrationDeadline: z.string().datetime({ message: "Invalid deadline format" }).optional(),
  maxCapacity: z.number().int().min(1).optional(),
  meetingLink: z.string().url("Meeting URL must be a valid URL").optional(),
  isPublished: z.boolean().optional(),
});

export const registerSessionValidation = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Invalid phone number"),
});
