import { z } from "zod";

// Mirrors the backend rules in kbs-cosmotics-backend/src/validations/auth.validation.ts
const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address");
const password = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Za-z]/, "Must contain a letter")
  .regex(/[0-9]/, "Must contain a number");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    companySlug: z.string().trim().toLowerCase().min(1, "Choose your company"),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().optional(),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
