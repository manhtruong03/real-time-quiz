// src/lib/schemas/auth.schema.ts
import { z } from "zod";

// Schema based on openapi.txt LoginRequest
export const LoginSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Tên người dùng phải có ít nhất 3 ký tự." })
    .max(50, { message: "Tên người dùng không được vượt quá 50 ký tự." }),
  password: z
    .string()
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." })
    .max(30, { message: "Mật khẩu không được vượt quá 30 ký tự." }),
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;

// Schema based on openapi.txt SignupRequest
export const SignupSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Tên người dùng phải có ít nhất 3 ký tự." })
    .max(50, { message: "Tên người dùng không được vượt quá 50 ký tự." }),
  email: z
    .string()
    .email({ message: "Vui lòng nhập địa chỉ email hợp lệ." })
    .max(200, { message: "Email không được vượt quá 200 ký tự." })
    .optional() // Make email optional based on openapi schema (no 'required' field)
    .or(z.literal("")), // Allow empty string as well for optional field
  password: z
    .string()
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." })
    .max(30, { message: "Mật khẩu không được vượt quá 30 ký tự." }),
  // Add confirmPassword if needed for UI, refine schema later
  // confirmPassword: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự."})
});
// Add refinement for password confirmation if you add the field:
// .refine((data) => data.password === data.confirmPassword, {
//   message: "Mật khẩu không khớp",
//   path: ["confirmPassword"], // Set error on confirm password field
// });

export type SignupSchemaType = z.infer<typeof SignupSchema>;
