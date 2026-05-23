import { z } from "zod";

export const generateContentSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
});

