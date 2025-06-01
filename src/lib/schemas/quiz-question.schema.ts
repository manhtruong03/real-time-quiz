// src/lib/schemas/quiz-question.schema.ts
// ADD THIS CHANGE:
import { z } from "zod";
// ChoiceHost is a structural type, not directly a Zod schema in this file, so no direct import for that.

const QuestionTypeEnum = z.enum([
  "quiz",
  "jumble",
  "open_ended",
  "survey",
  "content",
]);

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
      // Add other image fields if they are part of ChoiceHost's image structure and need validation
      width: z.number().optional(),
      height: z.number().optional(),
      origin: z.string().optional(),
      externalRef: z.string().optional(),
      resources: z.string().optional(),
      contentType: z.string().optional(),
    })
    .nullable() // Allow image to be null
    .optional(),
  correct: z.boolean().default(false),
});

export const ChoiceHostRefinedSchema = ChoiceHostObjectSchema.refine(
  (data) => {
    if (data.image) return true;
    if (data.answer !== undefined) return true; // Allow empty string if image is not present
    return false;
  },
  {
    message: "Choice should have text or an image.",
    path: ["answer"],
  }
);

const VideoSchema = z
  .object({
    id: z.string().optional(),
    startTime: z.number().optional().default(0.0),
    endTime: z.number().optional().default(0.0),
    service: z.string().optional().default("youtube"),
    fullUrl: z.string().url().or(z.literal("")).optional().default(""),
  })
  .optional()
  .nullable()
  .default(null);

const MediaItemSchema = z.object({
  type: z.string().optional(),
  url: z.string().url().optional(),
  id: z.string().optional(),
  altText: z.string().optional(),
  zIndex: z.number().optional(),
  isColorOnly: z.boolean().optional(),
  contentType: z.string().optional(),
  origin: z.string().optional(),
  externalRef: z.string().optional(),
  resources: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const BaseQuestionSchema = z.object({
  type: QuestionTypeEnum,
  image: z
    .string()
    .url({ message: "Invalid image URL" })
    .nullable()
    .optional()
    .default(null),
  imageFile: z.custom<File>().nullable().optional().default(null),
  questionImageUploadKey: z.string().nullable().optional().default(null), // New field
  video: VideoSchema,
  media: z.array(MediaItemSchema).optional().default([]),
  question: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  time: z.coerce.number().optional().default(20000),
  pointsMultiplier: z.coerce.number().optional().default(1),
  choices: z.array(ChoiceHostObjectSchema).optional().default([]),
  correctChoiceIndex: z.number().int().min(-1).optional().default(-1),
});

// ... (rest of ContentSchema, QuizQuestionSchema, JumbleQuestionSchema, OpenEndedQuestionSchema, SurveyQuestionSchema remain the same for this step)
// Ensure they extend the updated BaseQuestionSchema which now includes questionImageUploadKey.

// Example for QuizQuestionSchema (others follow the same pattern of extending BaseQuestionSchema)
export const QuizQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("quiz"),
  question: z
    .string()
    .min(1, "Question text is required.")
    .max(250, "Question text too long."),
  choices: z
    .array(ChoiceHostRefinedSchema)
    .min(2, "Quiz questions need 2-6 choices.")
    .max(6, "Maximum 6 choices allowed."),
  time: z.coerce
    .number()
    .positive("Time limit must be positive.")
    .default(20000),
  pointsMultiplier: z.coerce.number().min(0).max(2).default(1),
  correctChoiceIndex: z.number().int().min(-1).default(-1),
}).omit({ title: true, description: true });

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
  time: z.coerce.number().optional().default(0),
  pointsMultiplier: z.coerce.number().optional().default(0),
}).omit({ question: true, correctChoiceIndex: true });

export const JumbleQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("jumble"),
  question: z
    .string()
    .min(1, "Question text is required.")
    .max(250, "Question text too long."),
  choices: z
    .array(
      ChoiceHostObjectSchema.extend({
        correct: z.literal(true).default(true),
      }).refine((data) => !!data.answer, {
        message: "Jumble items must have text.",
        path: ["answer"],
      })
    )
    .min(2, "Jumble questions need 2-6 items.")
    .max(6, "Maximum 6 items allowed."),
  time: z.coerce
    .number()
    .positive("Time limit must be positive.")
    .default(60000),
  pointsMultiplier: z.coerce.number().min(0).max(2).default(1),
}).omit({ title: true, description: true, correctChoiceIndex: true });

export const OpenEndedQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("open_ended"),
  question: z
    .string()
    .min(1, "Question text is required.")
    .max(250, "Question text too long."),
  choices: z
    .array(
      ChoiceHostObjectSchema.extend({
        answer: z
          .string()
          .min(1, "Acceptable answer text cannot be empty.")
          .max(100),
        correct: z.literal(true).default(true),
        image: z.undefined().optional(),
      }).refine((data) => !!data.answer, {
        message: "Acceptable answer cannot be empty.",
        path: ["answer"],
      })
    )
    .min(1, "At least one correct answer required.")
    .max(10, "Maximum 10 acceptable answers."),
  time: z.coerce
    .number()
    .positive("Time limit must be positive.")
    .default(30000),
  pointsMultiplier: z.coerce.number().min(0).max(2).default(1),
}).omit({ title: true, description: true, correctChoiceIndex: true });

export const SurveyQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("survey"),
  question: z
    .string()
    .min(1, "Question text is required.")
    .max(250, "Question text too long."),
  choices: z
    .array(
      ChoiceHostObjectSchema.extend({
        correct: z.literal(true).default(true),
      }).refine((data) => !!data.answer || !!data.image, {
        message: "Survey options must have text or an image.",
        path: ["answer"],
      })
    )
    .min(2, "Polls need 2-6 options.")
    .max(6, "Maximum 6 options allowed."),
  time: z.coerce
    .number()
    .positive("Time limit must be positive.")
    .default(20000),
  pointsMultiplier: z.literal(0).default(0),
}).omit({ title: true, description: true, correctChoiceIndex: true });

const QuestionHostUnionSchema = z.discriminatedUnion("type", [
  ContentSchema,
  QuizQuestionSchema,
  JumbleQuestionSchema,
  OpenEndedQuestionSchema,
  SurveyQuestionSchema,
]);

export const QuestionHostSchema = QuestionHostUnionSchema.superRefine(
  (data, ctx) => {
    if (data.type === "quiz") {
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
    }
  }
);
// --- Export types ---
export type QuestionHostSchemaType = z.infer<typeof QuestionHostSchema>;
export type ChoiceHostSchemaType = z.infer<typeof ChoiceHostObjectSchema>;
export type QuestionFormContextType = z.infer<typeof BaseQuestionSchema>; // This now includes questionImageUploadKey
export type VideoSchemaType = z.infer<typeof VideoSchema>;
export type MediaItemSchemaType = z.infer<typeof MediaItemSchema>;
