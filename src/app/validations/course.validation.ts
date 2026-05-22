import { z } from "zod";

export const createCourseValidation = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description is too long"),
  price: z.number().min(0, "Price cannot be negative"),
  categoryId: z.string().uuid("Invalid category ID"),
  thumbnail: z.string().url("Thumbnail must be a valid URL").optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  previewVideo: z.string().url("Preview video must be a valid URL").optional(),
  language: z.string().trim().max(50).optional(),
});

export const updateCourseValidation = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  thumbnail: z.string().url("Thumbnail must be a valid URL").optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  previewVideo: z.string().url("Preview video must be a valid URL").optional(),
  language: z.string().trim().max(50).optional(),
});

export const completeLessonValidation = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  courseId: z.string().uuid("Invalid course ID"),
});
