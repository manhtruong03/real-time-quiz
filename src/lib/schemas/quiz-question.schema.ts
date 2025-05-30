// src/lib/schemas/quiz-question.schema.ts
import { z } from "zod";
import type { ChoiceHost } from "@/src/lib/types/quiz-structure"; // Keep if needed

const QuestionTypeEnum = z.enum([
  "quiz",
  "jumble",
  "open_ended",
  "survey",
  "content",
]);

// Base choice schema (Object type) - unchanged
const ChoiceHostObjectSchema = z.object({
  answer: z
    .string()
    .max(100, "Answer text cannot exceed 100 characters.")
    .optional(),
  image: z
    .object({
      id: z.string(),
      url: z.string().url().optional(),
      altText: z.string().optional(),
    })
    .optional(),
  correct: z.boolean().default(false),
});

// Refined choice schema (Effect type - ensure text or image) - unchanged
export const ChoiceHostRefinedSchema = ChoiceHostObjectSchema.refine(
  (data) => {
    // Valid if an image exists
    if (data.image) {
      return true;
    }
    // Valid if answer is defined (including empty string)
    if (data.answer !== undefined) {
      return true;
    }
    // Invalid if both are missing/undefined
    return false;
  },
  {
    // Message if validation fails
    message: "Choice should have text or an image.",
    path: ["answer"], // Path for the error message
  }
);

// Base question schema with temporary index field - unchanged
// --- Updated BaseQuestionSchema to include video and media ---
const VideoSchema = z
  .object({
    id: z.string().optional(), // Added based on Kahoot structure examples
    startTime: z.number().optional().default(0.0),
    endTime: z.number().optional().default(0.0),
    service: z.string().optional().default("youtube"),
    fullUrl: z.string().url().or(z.literal("")).optional().default(""),
  })
  .optional()
  .nullable()
  .default(null); // Make the whole video object optional and nullable

const MediaItemSchema = z
  .object({
    // Define a basic structure for media items
    type: z.string().optional(), // e.g., "image", "video_iframe", "background_image"
    url: z.string().url().optional(),
    id: z.string().optional(), // Often used for Getty images, etc.
    altText: z.string().optional(),
    // Add other common media properties if needed from docs
    zIndex: z.number().optional(),
    isColorOnly: z.boolean().optional(),
    contentType: z.string().optional(),
    origin: z.string().optional(),
    externalRef: z.string().optional(),
    resources: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .optional();

const BaseQuestionSchema = z.object({
  type: QuestionTypeEnum,
  image: z // This will store the URL (string) for preview, including object URLs
    .string()
    .url({ message: "Invalid image URL" })
    .nullable()
    .optional()
    .default(null),

  imageFile: z.custom<File>().nullable().optional().default(null), // RHF will manage this File object

  video: VideoSchema, // Use the defined VideoSchema
  media: z.array(MediaItemSchema).optional().default([]), // Array of MediaItemSchema
  question: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  time: z.number().optional().default(20000),
  pointsMultiplier: z.number().optional().default(1),
  choices: z.array(ChoiceHostObjectSchema).optional().default([]),
  correctChoiceIndex: z.number().int().min(-1).optional().default(-1),
});

// --- Schemas for specific types (ensure NO .refine/.superRefine here) ---

export const ContentSchema = BaseQuestionSchema.extend({
  type: z.literal("content"),
  title: z.string().min(1, "Title is required.").max(120, "Title too long."),
  description: z
    .string()
    .max(1000, "Description too long.")
    .optional()
    .default(""),
  image: z
    .string()
    .url({ message: "Invalid image URL" })
    .nullable()
    .optional()
    .default(null),
  choices: z
    .array(ChoiceHostObjectSchema)
    .max(0, "Content slides cannot have choices.")
    .optional()
    .default([]),
  time: z.number().optional().default(0),
  pointsMultiplier: z.number().optional().default(0),
}).omit({ question: true, correctChoiceIndex: true });

export const QuizQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("quiz"),
  question: z
    .string()
    .min(1, "Question text is required.")
    .max(250, "Question text too long."),
  // Apply refinement to the array items *within* the definition
  choices: z
    .array(ChoiceHostRefinedSchema)
    .min(2, "Quiz questions need 2-6 choices.")
    .max(6, "Maximum 6 choices allowed."),
  time: z.number().positive("Time limit must be positive.").default(20000),
  pointsMultiplier: z.number().min(0).max(2).default(1),
  correctChoiceIndex: z.number().int().min(-1).default(-1), // Keep temporary field
}).omit({ title: true, description: true });

// --- Fix Jumble, OpenEnded, Survey choices ---
export const JumbleQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("jumble"),
  question: z
    .string()
    .min(1, "Question text is required.")
    .max(250, "Question text too long."),
  // Extend BASE, then refine items in the array
  choices: z
    .array(
      ChoiceHostObjectSchema.extend({ correct: z.literal(true).default(true) }) // Extend base object
        .refine((data) => !!data.answer, {
          // Refine this specific item type
          message: "Jumble items must have text.",
          path: ["answer"],
        })
    )
    .min(2, "Jumble questions need 2-6 items.")
    .max(6, "Maximum 6 items allowed."),
  time: z.number().positive("Time limit must be positive.").default(60000),
  pointsMultiplier: z.number().min(0).max(2).default(1),
}).omit({ title: true, description: true, correctChoiceIndex: true });

export const OpenEndedQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("open_ended"),
  question: z
    .string()
    .min(1, "Question text is required.")
    .max(250, "Question text too long."),
  // Extend BASE, then refine items in the array
  choices: z
    .array(
      ChoiceHostObjectSchema.extend({
        // Extend base object
        answer: z
          .string()
          .min(1, "Acceptable answer text cannot be empty.")
          .max(100),
        correct: z.literal(true).default(true),
        image: z.undefined().optional(),
      }).refine((data) => !!data.answer, {
        // Refine this specific item type
        message: "Acceptable answer cannot be empty.",
        path: ["answer"],
      })
    )
    .min(1, "At least one correct answer required.")
    .max(10, "Maximum 10 acceptable answers."),
  time: z.number().positive("Time limit must be positive.").default(30000),
  pointsMultiplier: z.number().min(0).max(2).default(1),
}).omit({ title: true, description: true, correctChoiceIndex: true });

export const SurveyQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("survey"),
  question: z
    .string()
    .min(1, "Question text is required.")
    .max(250, "Question text too long."),
  // Extend BASE, then refine items in the array
  choices: z
    .array(
      ChoiceHostObjectSchema.extend({
        // Extend base object
        correct: z.literal(true).default(true),
      }).refine((data) => !!data.answer || !!data.image, {
        // Refine this specific item type
        message: "Survey options must have text or an image.",
        path: ["answer"],
      })
    )
    .min(2, "Polls need 2-6 options.")
    .max(6, "Maximum 6 options allowed."),
  time: z.number().positive("Time limit must be positive.").default(20000),
  pointsMultiplier: z.literal(0).default(0),
}).omit({ title: true, description: true, correctChoiceIndex: true });
// --- End Fixes for Jumble, OpenEnded, Survey ---

// Union of OBJECTS
const QuestionHostUnionSchema = z.discriminatedUnion("type", [
  ContentSchema,
  QuizQuestionSchema, // This is a ZodObject now
  JumbleQuestionSchema, // This is a ZodObject
  OpenEndedQuestionSchema, // This is a ZodObject
  SurveyQuestionSchema, // This is a ZodObject
]);

// Apply refinement AFTER the union
export const QuestionHostSchema = QuestionHostUnionSchema.superRefine(
  (data, ctx) => {
    if (data.type === "quiz") {
      // Only check bounds if index is selected
      if (
        data.correctChoiceIndex >= 0 &&
        data.choices &&
        data.correctChoiceIndex >= data.choices.length
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selected correct answer index is out of bounds.",
          path: ["correctChoiceIndex"],
        });
      }
      // Optional: Add check here to ensure correctChoiceIndex is >= 0 *only* if saving the entire quiz,
      // but allow -1 during intermediate editing steps. For now, allow -1.
    }
  }
);

// --- Export types ---
export type QuestionHostSchemaType = z.infer<typeof QuestionHostSchema>;
export type ChoiceHostSchemaType = z.infer<typeof ChoiceHostObjectSchema>;
export type QuestionFormContextType = z.infer<typeof BaseQuestionSchema>;
export type VideoSchemaType = z.infer<typeof VideoSchema>;
export type MediaItemSchemaType = z.infer<typeof MediaItemSchema>;
