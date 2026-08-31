import { z } from "zod";

// Custom email regex that accepts any valid email format.
// This is intentionally permissive (matches what most users expect)
// so that valid addresses on any provider (Gmail, Outlook, custom
// corporate domains, etc.) pass — z.string().email() is RFC-strict
// and rejects some perfectly valid real-world addresses.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const trialRequestSchema = z.object({
  // Where the license key gets emailed - NOT part of the signed license
  // payload itself, since LicenseKeyGenerator.java's format only has
  // customerName, not a separate email field.
  email: z
    .string()
    .min(1, "Email is required")
    .refine((val) => emailRegex.test(val), {
      message: "Please enter a valid email address",
    }),
  customerName: z.string().min(2).max(200),
});

export type TrialRequest = z.infer<typeof trialRequestSchema>;
