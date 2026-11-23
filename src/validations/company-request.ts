import { z } from "zod";

// Mirrors createCompanyRequestSchema in kbs-cosmotics-backend/src/validations/platform.validation.ts
const phone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(/^\+?[0-9 ()-]{7,30}$/, "Enter a valid phone number");
const optionalPhone = z.union([z.literal(""), phone]).optional();
const optionalEmail = z.union([z.literal(""), z.string().trim().email("Enter a valid email address")]).optional();

export const companyRequestSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(150),
  phone,
  secondaryPhone: optionalPhone,
  email: optionalEmail,
  city: z.string().trim().max(100).optional(),
  address: z.string().trim().max(255).optional(),
  description: z.string().trim().max(2000).optional(),
  contactFirstName: z.string().trim().min(1, "Your first name is required").max(100),
  contactLastName: z.string().trim().max(100).optional(),
  contactEmail: z.string().trim().min(1, "Your email is required").email("Enter a valid email address"),
  contactPhone: optionalPhone,
  message: z.string().trim().max(2000).optional(),
});

export type CompanyRequestValues = z.infer<typeof companyRequestSchema>;
