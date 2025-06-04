// src/lib/schemas/admin/user-account.schema.ts
import { z } from "zod";

// UserRoleEnum and UserRole remain the same
export const UserRoleEnum = z.enum(["USER", "TEACHER", "ADMIN"], {
  required_error: "Vai trò là bắt buộc.",
  invalid_type_error: "Vai trò không hợp lệ.",
});
export type UserRole = z.infer<typeof UserRoleEnum>;

// Schema for User Account Creation (from Phase 2)
export const userAccountCreationSchema = z
  .object({
    username: z
      .string({ required_error: "Tên tài khoản là bắt buộc." })
      .min(3, { message: "Tên tài khoản phải có ít nhất 3 ký tự." })
      .max(50, { message: "Tên tài khoản không được vượt quá 50 ký tự." })
      .regex(/^[a-zA-Z0-9]+(?:[_.-][a-zA-Z0-9]+)*$/, {
        message:
          "Tên tài khoản chỉ được chứa chữ cái, số, và dấu gạch dưới/ngang/chấm (không ở đầu/cuối, không lặp lại).",
      }),
    email: z
      .string()
      .email({ message: "Địa chỉ email không hợp lệ." })
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((email) => (email === "" ? null : email)),
    password: z
      .string({ required_error: "Mật khẩu là bắt buộc." })
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." })
      .max(30, { message: "Mật khẩu không được vượt quá 30 ký tự." }),
    confirmPassword: z
      .string({ required_error: "Xác nhận mật khẩu là bắt buộc." })
      .min(6, { message: "Xác nhận mật khẩu phải có ít nhất 6 ký tự." }),
    role: UserRoleEnum,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu và xác nhận mật khẩu không khớp.",
    path: ["confirmPassword"],
  });

export type UserAccountCreationFormValues = z.infer<
  typeof userAccountCreationSchema
>;

// --- ADD SCHEMA FOR USER ACCOUNT UPDATE ---
export const userAccountUpdateSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Tên tài khoản phải có ít nhất 3 ký tự." })
    .max(50, { message: "Tên tài khoản không được vượt quá 50 ký tự." })
    .regex(/^[a-zA-Z0-9]+(?:[_.-][a-zA-Z0-9]+)*$/, {
      message:
        "Tên tài khoản chỉ được chứa chữ cái, số, và dấu gạch dưới/ngang/chấm (không ở đầu/cuối, không lặp lại).",
    })
    .optional(), // Username is optional for update; if provided, it must be valid.
  email: z
    .string()
    .email({ message: "Địa chỉ email không hợp lệ." })
    .nullable() // Allows API to receive null to clear email if desired
    .optional() // Field itself is optional
    .or(z.literal("")) // Allows empty string in form
    .transform((emailInput) => (emailInput === "" ? null : emailInput)), // Transform empty string to null for API
  role: UserRoleEnum.optional(), // Role is optional for update
  // storageLimit: z.number().int().positive().nullable().optional(), // Example if storageLimit were editable
});

// Infer the TypeScript type for the update form values
export type UserAccountUpdateFormValues = z.infer<
  typeof userAccountUpdateSchema
>;
