import { Router } from "express";
import express from "express";
import { verifyWebhookSignature } from "../lib/razorpay.js";
import { buildLicensePayload, issueLicenseKey } from "../lib/license.js";
import { sendLicenseEmail } from "../lib/email.js";

export const webhookRouter = Router();

/**
 * IMPORTANT: this router uses express.raw() instead of express.json(),
 * because Razorpay's signature check must run against the exact raw
 * bytes of the request body - re-parsing/re-serializing JSON would
 * produce a different byte sequence and always fail verification.
 *
 * This router MUST be mounted in index.ts BEFORE the global
 * express.json() middleware, so this raw parser runs first for this
 * path. Once this route sends a response, Express stops the middleware
 * chain for that request, so the later express.json() never touches it.
 */
webhookRouter.use("/webhooks/razorpay", express.raw({ type: "application/json" }));

/**
 * POST /webhooks/razorpay
 *
 * Configure this exact URL in the Razorpay dashboard's webhook settings
 * once deployed, subscribed to the "payment.captured" event (or
 * "payment_link.paid" if using Payment Links specifically).
 *
 * Known gap, same as the trial route: no persistence layer yet, so a
 * webhook retry (Razorpay retries on non-2xx or timeout) would issue a
 * second license for the same payment. Low-impact for now (an extra
 * PERPETUAL license costs nothing), but worth a dedup table later if
 * this becomes a real concern.
 */
webhookRouter.post("/webhooks/razorpay", async (req, res) => {
  const signatureHeader = req.headers["x-razorpay-signature"];
  if (typeof signatureHeader !== "string") {
    return res.status(400).json({ error: "Missing X-Razorpay-Signature header" });
  }

  let signatureValid: boolean;
  try {
    signatureValid = verifyWebhookSignature(req.body as Buffer, signatureHeader);
  } catch (err) {
    // RAZORPAY_WEBHOOK_SECRET not configured yet - expected until the
    // real Razorpay account is wired in.
    console.error("Webhook verification unavailable:", (err as Error).message);
    return res.status(500).json({ error: "Webhook not configured yet" });
  }

  if (!signatureValid) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = JSON.parse((req.body as Buffer).toString("utf8"));

  // Only act on a successful payment. Acknowledge (200) everything else
  // so Razorpay doesn't keep retrying events we don't care about.
  if (event.event !== "payment.captured" && event.event !== "payment_link.paid") {
    return res.status(200).json({ received: true, ignored: true });
  }

  const paymentEntity = event.payload?.payment?.entity;
  if (!paymentEntity) {
    return res.status(400).json({ error: "Unexpected payload shape - no payment entity" });
  }

  const email: string | undefined = paymentEntity.email || paymentEntity.notes?.email;
  const customerName: string = paymentEntity.notes?.customerName || "Customer";

  if (!email) {
    console.error("Payment captured but no email available to send license to:", paymentEntity.id);
    // Still acknowledge with 200 - the payment succeeded, this is a data
    // problem to investigate manually, not something Razorpay should retry.
    return res.status(200).json({ received: true, warning: "No email found - license not sent" });
  }

  try {
    const payload = buildLicensePayload({
      licenseType: "PERPETUAL",
      customerName,
    });
    const licenseKey = issueLicenseKey(payload);

    await sendLicenseEmail({
      toEmail: email,
      customerName,
      licenseKey,
      payload,
    });

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Failed to issue/send license after payment:", err);
    // Non-2xx so Razorpay retries - the payment already succeeded, so we
    // want another attempt at issuing the license rather than silently
    // dropping it.
    res.status(500).json({ error: "Could not issue license - will retry" });
  }
});
