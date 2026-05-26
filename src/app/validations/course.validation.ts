import { z } from "zod";

export const createCourseValidation = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description is too long"),
  // coerce string to number (FormData always sends strings)
  price: z.coerce.number().min(0, "Price cannot be negative"),
  categoryId: z.string().uuid("Invalid category ID"),
  thumbnail: z.string().url("Thumbnail must be a valid URL").optional(),
  previewVideo: z.string().url("Preview video must be a valid URL").optional(),
  // Added by controller (authenticated instructor)
  instructorProfileId: z.string().uuid("Invalid instructor profile ID").optional(),
  // Arrays may come as JSON strings from FormData, preprocess them
  learningOutcomes: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string())
  ).optional(),
  requirements: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string())
  ).optional(),
  targetAudience: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string())
  ).optional(),
  tags: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string())
  ).optional(),
  // coerce boolean strings from FormData
  hasCertificate: z.coerce.boolean().optional(),
  isPublished: z.coerce.boolean().optional(),
});   

export const updateCourseValidation = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title is too long")
    .optional(),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description is too long")
    .optional(),

  // FormData sends string values
  price: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .optional(),

  categoryId: z
    .string()
    .uuid("Invalid category ID")
    .optional(),

  thumbnail: z
    .string()
    .url("Thumbnail must be a valid URL")
    .optional(),

  previewVideo: z
    .string()
    .url("Preview video must be a valid URL")
    .optional(),

  learningOutcomes: z
    .preprocess(
      (val) => (typeof val === "string" ? JSON.parse(val) : val),
      z.array(z.string())
    )
    .optional(),

  requirements: z
    .preprocess(
      (val) => (typeof val === "string" ? JSON.parse(val) : val),
      z.array(z.string())
    )
    .optional(),

  targetAudience: z
    .preprocess(
      (val) => (typeof val === "string" ? JSON.parse(val) : val),
      z.array(z.string())
    )
    .optional(),

  tags: z
    .preprocess(
      (val) => (typeof val === "string" ? JSON.parse(val) : val),
      z.array(z.string())
    )
    .optional(),

  hasCertificate: z.coerce.boolean().optional(),


  isPublished: z.coerce.boolean().optional(),
});


export const completeLessonValidation = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  courseId: z.string().uuid("Invalid course ID"),
});
