import { z } from "zod";

export const createLiveSessionValidation = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000).optional(),
  thumbnail: z.string().optional(),
  sessionDate: z.string().optional(),
  sessionTime: z.string().optional(),
  registrationDeadlineDate: z.string().optional(),
  registrationDeadlineTime: z.string().optional(),
  maxCapacity: z.number().int().min(1).optional(),
  meetingLink: z.string().url("Meeting URL must be a valid URL").optional(),
  isPublished: z.boolean().optional(),
  // New metadata fields
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  learningOutcomes: z.array(z.string().min(5)).max(12).optional(),
  whoShouldAttend: z.array(z.string().min(3)).max(5).optional(),
  keyTopics: z.array(z.string().min(3)).max(15).optional(),
});

export const updateLiveSessionValidation = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  thumbnail: z.string().optional(),
  sessionDate: z.string().optional(),
  sessionTime: z.string().optional(),
  registrationDeadlineDate: z.string().optional(),
  registrationDeadlineTime: z.string().optional(),

  maxCapacity: z.number().int().min(1).optional(),
  meetingLink: z.string().url("Meeting URL must be a valid URL").optional(),
  isPublished: z.boolean().optional(),
  // New metadata fields for updates (optional)
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  learningOutcomes: z.array(z.string().min(5)).max(12).optional(),
  whoShouldAttend: z.array(z.string().min(3)).max(5).optional(),
  keyTopics: z.array(z.string().min(3)).max(15).optional(),
});

export const registerSessionValidation = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Invalid phone number"),
});
