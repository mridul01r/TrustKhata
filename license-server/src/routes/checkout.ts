import { Router } from "express";
import { z } from "zod";
import { createPaymentLink } from "../lib/razorpay.js";

export const checkoutRouter = Router();

const createLinkSchema = z.object({
  customerName: z.string().min(2).max(200),
  email: z.string().email(),
  amountRupees: z.number().positive(),
});

/**
 * POST /checkout/create-payment-link
 * Body: { customerName, email, amountRupees }
 *
 * Called by the website's "Buy now" button once it's connected. Returns
 * a Razorpay-hosted payment page URL to redirect the customer to.
 *
 * Fully wired already - the only thing missing right now is the real
 * RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET in .env, which will make this
 * work the moment they're added. Until then this returns a clear 500
 * rather than crashing.
 */
checkoutRouter.post("/checkout/create-payment-link", async (req, res) => {
  const parseResult = createLinkSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  try {
    const link = await createPaymentLink(parseResult.data);
    res.status(201).json({ paymentUrl: link.short_url });
  } catch (err) {
    console.error("Failed to create payment link:", err);
    res.status(500).json({ error: "Could not create payment link. Please try again." });
  }
});
