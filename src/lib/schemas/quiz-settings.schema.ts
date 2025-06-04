// src/lib/schemas/quiz-settings.schema.ts
import { z } from "zod";

export const QuizVisibilityEnum = z.enum(["PRIVATE", "PUBLIC"]);

export const QuizMetadataSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Tiêu đề phải có ít nhất 3 ký tự." })
    .max(100, { message: "Tiêu đề không được vượt quá 100 ký tự." }),
  description: z
    .string()
    .max(500, { message: "Mô tả không được vượt quá 500 ký tự." })
    .optional(),
  visibility: QuizVisibilityEnum.default("PRIVATE"),
  language: z.string().optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, { message: "Thẻ không được để trống." })
        .max(50, { message: "Thẻ không được vượt quá 50 ký tự." })
    )
    .max(10, { message: "Bạn có thể thêm tối đa 10 thẻ." })
    .optional()
    .default([]),
  cover: z
    .string()
    .max(1024, { message: "URL ảnh bìa quá dài." })
    .optional()
    .nullable()
    .default(null),
  coverImageFile: z.custom<File>().nullable().optional().default(null),
  coverImageUploadKey: z.string().nullable().optional().default(null),
});

export type QuizMetadataSchemaType = z.infer<typeof QuizMetadataSchema>;
