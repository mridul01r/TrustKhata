import { z } from "zod";

export const trialRequestSchema = z.object({
  // Where the license key gets emailed - NOT part of the signed license
  // payload itself, since LicenseKeyGenerator.java's format only has
  // customerName, not a separate email field.
  email: z.string().email(),
  customerName: z.string().min(2).max(200),
});

export type TrialRequest = z.infer<typeof trialRequestSchema>;
