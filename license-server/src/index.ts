import "dotenv/config";
import express from "express";
import { verifyLicenseKeyLocally } from "./lib/license.js";
import { trialRouter } from "./routes/trial.js";
import { webhookRouter } from "./routes/webhook.js";
import { checkoutRouter } from "./routes/checkout.js";

const app = express();

// IMPORTANT: webhookRouter must be mounted BEFORE express.json() below.
// It applies its own express.raw() parser internally (needed for Razorpay
// signature verification), and since it sends a response for every request
// it handles, the global express.json() further down never runs for
// those requests - order here matters, don't move this below the
// express.json() line.
app.use(webhookRouter);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(trialRouter);
app.use(checkoutRouter);

/**
 * Sanity-check endpoint only — lets you confirm a license key you
 * generated is well-formed and signature-valid before it goes near a
 * real user. Not used by the desktop app (that verifies fully offline).
 */
app.post("/debug/verify", (req, res) => {
  const { licenseKey } = req.body as { licenseKey?: string };
  if (!licenseKey) {
    return res.status(400).json({ error: "licenseKey is required" });
  }
  const result = verifyLicenseKeyLocally(licenseKey);
  res.json(result);
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`License server listening on port ${port}`);
});
