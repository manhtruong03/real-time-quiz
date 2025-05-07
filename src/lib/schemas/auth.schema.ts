// src/lib/schemas/auth.schema.ts
import { z } from "zod";

// Schema based on openapi.txt LoginRequest
export const LoginSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(50, { message: "Username cannot exceed 50 characters." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(30, { message: "Password cannot exceed 30 characters." }),
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;

// Schema based on openapi.txt SignupRequest
export const SignupSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(50, { message: "Username cannot exceed 50 characters." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .max(200, { message: "Email cannot exceed 200 characters." })
    .optional() // Make email optional based on openapi schema (no 'required' field)
    .or(z.literal("")), // Allow empty string as well for optional field
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(30, { message: "Password cannot exceed 30 characters." }),
  // Add confirmPassword if needed for UI, refine schema later
  // confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters long."})
});
// Add refinement for password confirmation if you add the field:
// .refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords don't match",
//   path: ["confirmPassword"], // Set error on confirm password field
// });

export type SignupSchemaType = z.infer<typeof SignupSchema>;
