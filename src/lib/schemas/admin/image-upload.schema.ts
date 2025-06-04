// src/lib/schemas/admin/image-upload.schema.ts
import { z } from "zod";

const MAX_FILE_SIZE_MB = 5; // Maximum file size in Megabytes
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to Bytes

// Define accepted image MIME types
const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg", // .jpg, .jpeg
  "image/png", // .png
  "image/gif", // .gif
  "image/webp", // .webp
];

// User-friendly string for accepted extensions (for error messages)
const ACCEPTED_IMAGE_EXTENSIONS_STRING = ".jpg, .jpeg, .png, .gif, .webp";

export const imageUploadSchema = z.object({
  /**
   * Validates the image file input.
   * Expects a FileList (from <input type="file">) or a single File object.
   */
  imageFile: z
    .custom<FileList | File>(
      (val) => val instanceof FileList || val instanceof File,
      {
        message: "Dữ liệu hình ảnh không hợp lệ. Vui lòng chọn một tệp.",
      }
    )
    // First, ensure a file is present (FileList is not empty or File object exists)
    .refine(
      (val) => {
        if (val instanceof FileList) {
          return val.length > 0; // Check if FileList has at least one file
        }
        return !!val; // Check if File object itself is not null/undefined
      },
      {
        message: "Hình ảnh là bắt buộc. Vui lòng chọn một tệp.",
      }
    )
    // Transform FileList to a single File object if necessary
    .transform((val) => (val instanceof FileList ? val[0] : val))
    // Now, perform checks on the single File object
    .refine(
      (file) => file.size <= MAX_FILE_SIZE_BYTES,
      `Kích thước ảnh tối đa là ${MAX_FILE_SIZE_MB}MB. Vui lòng chọn tệp nhỏ hơn.`
    )
    .refine(
      (file) => ACCEPTED_IMAGE_MIME_TYPES.includes(file.type),
      `Định dạng tệp không hợp lệ. Chỉ chấp nhận các định dạng: ${ACCEPTED_IMAGE_EXTENSIONS_STRING}.`
    ),

  // As per the plan, creatorId is omitted from the form in this phase.
  // If it were to be included (e.g., in a later phase):
  // creatorId: z.string().uuid("Định dạng ID người tạo không hợp lệ.").optional().nullable(),
});

// Infer the TypeScript type from the Zod schema
export type ImageUploadSchemaType = z.infer<typeof imageUploadSchema>;
