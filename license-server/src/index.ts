import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifyLicenseKeyLocally } from "./lib/license.js";
import { trialRouter } from "./routes/trial.js";
import { webhookRouter } from "./routes/webhook.js";
import { checkoutRouter } from "./routes/checkout.js";

const app = express();

// Allows the marketing site (next-app, e.g. on Vercel) to call this API
// directly from the browser (fetch from the download-email-gate modal).
// Set ALLOWED_ORIGIN in .env to your deployed site's exact origin
// (e.g. https://trust-khata.vercel.app) - falls back to "*" only so local
// dev doesn't break; lock this down before going live publicly.
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin, methods: ["GET", "POST", "OPTIONS"] }));

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