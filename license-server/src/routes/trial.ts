import { Router } from "express";
import { trialRequestSchema } from "../lib/validation.js";
import { buildLicensePayload, issueLicenseKey } from "../lib/license.js";
import { sendLicenseEmail } from "../lib/email.js";

export const trialRouter = Router();

const TRIAL_DAYS = 14;

/**
 * POST /trial
 * Body: { email: string, businessName: string }
 *
 * Issues a time-limited trial license and emails it to the user.
 * Later, your website's "Start free trial" button/form should call
 * this endpoint directly.
 *
 * NOTE: this does not yet prevent the same email from requesting
 * unlimited trials back-to-back — see README "Known gaps" before
 * going live publicly.
 */
trialRouter.post("/trial", async (req, res) => {
  const parseResult = trialRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email, customerName } = parseResult.data;

  try {
    const payload = buildLicensePayload({
      licenseType: "TRIAL",
      customerName,
      trialDays: TRIAL_DAYS,
    });
    const licenseKey = issueLicenseKey(payload);

    await sendLicenseEmail({
      toEmail: email,
      customerName,
      licenseKey,
      payload,
    });

    // licenseKey is also returned directly so the website can show it
    // on-screen immediately, not just rely on email delivery.
    res.status(201).json({
      licenseKey,
      expiryDate: payload.expiryDate,
    });
  } catch (err) {
    console.error("Failed to issue trial license:", err);
    res.status(500).json({ error: "Could not issue trial license. Please try again." });
  }
});
