import { Router } from "express";
import { z } from "zod";
import { sendPasswordResetEmail } from "../lib/email.js";
import { Resend } from "resend";

export const passwordResetRouter = Router();

// Permissive email regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requestResetSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .refine((val) => emailRegex.test(val), {
      message: "Please enter a valid email address",
    }),
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * POST /password-reset/request
 * Body: { email: string }
 *
 * Request a password reset for the given email.
 * Since we don't have a database of users here, this endpoint is meant to be
 * called by a frontend that has authenticated users. The actual user lookup
 * and token generation should happen on the backend.
 *
 * This endpoint sends a password reset email to the user.
 */
passwordResetRouter.post("/password-reset/request", async (req, res) => {
  const parseResult = requestResetSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email } = parseResult.data;

  try {
    await sendPasswordResetEmail({
      toEmail: email,
      resetUrl: `${FRONTEND_URL}/reset-password`,
    });

    // Always return success to prevent email enumeration attacks
    res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    // Still return success to prevent email enumeration
    res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  }
});
