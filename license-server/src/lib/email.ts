import { Resend } from "resend";
import type { LicensePayload } from "./license.js";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set.");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function formatExpiry(payload: LicensePayload): string {
  if (!payload.expiryDate) return "This license does not expire.";
  const date = new Date(payload.expiryDate);
  return `This trial license expires on ${date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}.`;
}

export async function sendLicenseEmail(params: {
  toEmail: string;
  customerName: string;
  licenseKey: string;
  payload: LicensePayload;
}): Promise<void> {
  const fromAddress = process.env.LICENSE_EMAIL_FROM;
  if (!fromAddress) {
    throw new Error("LICENSE_EMAIL_FROM is not set.");
  }

  const isTrial = params.payload.licenseType === "TRIAL";
  const subject = isTrial
    ? "Your RetailERP trial license key"
    : "Your RetailERP license key";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Welcome to RetailERP, ${params.customerName}!</h2>
      <p>${isTrial ? "Your free trial is ready." : "Thanks for your purchase — your license is ready."}</p>
      <p>Paste this key into the app's activation screen:</p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0; word-break: break-all; font-family: monospace; font-size: 13px;">
        ${params.licenseKey}
      </div>
      <p style="color: #555; font-size: 14px;">${formatExpiry(params.payload)}</p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        Keep this email — you may need this key again if you reinstall the app.
      </p>
    </div>
  `;

  const client = getResendClient();
  const result = await client.emails.send({
    from: fromAddress,
    to: params.toEmail,
    subject,
    html,
  });

  if (result.error) {
    throw new Error(`Failed to send license email: ${result.error.message}`);
  }
}

interface PasswordResetEmailParams {
  toEmail: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  const fromAddress = process.env.LICENSE_EMAIL_FROM;
  if (!fromAddress) {
    throw new Error("LICENSE_EMAIL_FROM is not set.");
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password. Click the link below to set a new password:</p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0; word-break: break-all;">
        <a href="${params.resetUrl}" style="color: #0066cc; font-size: 16px;">Click here to reset your password</a>
      </div>
      <p style="color: #555; font-size: 14px;">This link will expire in 1 hour.</p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password won't be changed unless you click the link above.
      </p>
    </div>
  `;

  const client = getResendClient();
  const result = await client.emails.send({
    from: fromAddress,
    to: params.toEmail,
    subject: "Reset your RetailERP password",
    html,
  });

  if (result.error) {
    throw new Error(`Failed to send password reset email: ${result.error.message}`);
  }
}
