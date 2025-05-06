// src/lib/schemas/quiz-settings.schema.ts
import { z } from "zod";

export const QuizVisibilityEnum = z.enum(["PRIVATE", "PUBLIC"]);

export const QuizMetadataSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long." })
    .max(100, { message: "Title cannot exceed 100 characters." }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters." })
    .optional(),
  visibility: QuizVisibilityEnum.default("PRIVATE"),
  language: z.string().optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, { message: "Tag cannot be empty." })
        .max(50, { message: "Tag cannot exceed 50 characters." })
    )
    .max(10, { message: "You can add a maximum of 10 tags." })
    .optional()
    .default([]),
  // --- PHASE 4 FIELD ---
  cover: z
    .string()
    // .url({ message: "Please enter a valid URL." }) // Optional: Enable stricter URL validation if needed
    .max(1024, { message: "Cover URL too long." }) // Example length limit
    .optional()
    .nullable() // Allow null or undefined
    .default(null), // Default to null
});

export type QuizMetadataSchemaType = z.infer<typeof QuizMetadataSchema>;
