import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

/**
 * Verifies a Razorpay webhook's signature using HMAC-SHA256 over the RAW
 * request body, per Razorpay's docs. This MUST run against the raw bytes
 * exactly as received - re-serializing parsed JSON will not match.
 *
 * Requires RAZORPAY_WEBHOOK_SECRET (set in your Razorpay dashboard's
 * webhook settings, and copied into this server's .env). Not yet set -
 * that's expected until the real Razorpay account is wired in.
 */
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "RAZORPAY_WEBHOOK_SECRET is not set. Add it to .env once the webhook " +
        "is configured in the Razorpay dashboard."
    );
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signatureHeader, "utf8");

  // timingSafeEqual requires equal-length buffers, or it throws - guard that.
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

let razorpayClient: Razorpay | null = null;

function getClient(): Razorpay {
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error(
        "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set. Add your real " +
          "Razorpay dashboard keys to .env to enable payment link creation."
      );
    }
    razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpayClient;
}

export interface CreatePaymentLinkParams {
  customerName: string;
  email: string;
  /** Amount in rupees (not paise) - converted internally. */
  amountRupees: number;
}

/**
 * Creates a Razorpay Payment Link the website can redirect the customer
 * to. This is the piece that will be called from your website's "Buy now"
 * flow once it's connected - for now it's fully wired and will work the
 * moment real RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are added to .env.
 *
 * customerName/email are stamped into `notes` so the webhook handler can
 * recover them later without needing its own database lookup.
 */
export async function createPaymentLink(params: CreatePaymentLinkParams) {
  const client = getClient();
  return client.paymentLink.create({
    amount: Math.round(params.amountRupees * 100), // Razorpay wants paise
    currency: "INR",
    customer: {
      name: params.customerName,
      email: params.email,
    },
    notify: { email: true, sms: false },
    notes: {
      customerName: params.customerName,
      email: params.email,
    },
    // TODO: once the website exists, point this at a real "thank you" page.
    callback_url: process.env.PAYMENT_CALLBACK_URL ?? "https://example.com/payment-success",
    callback_method: "get",
  });
}
