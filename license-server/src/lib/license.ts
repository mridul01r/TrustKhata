import { sign, verify } from "node:crypto";
import { loadSigningPrivateKey, loadVerifyingPublicKey } from "./keys.js";

/**
 * IMPORTANT: this must stay byte-for-byte compatible with the existing
 * desktop app's offline verifier (originally built via the standalone
 * `LicenseKeyGenerator.java` tool in /license-tool). That tool:
 *   - builds a pipe-delimited payload: customerName|licenseType|issuedDate|expiryDate
 *   - licenseType is "TRIAL" or "PERPETUAL" (not "PAID")
 *   - dates are date-only (yyyy-MM-dd), not full timestamps
 *   - expiryDate is an empty string for PERPETUAL
 *   - payload and signature are each base64url-encoded (no padding),
 *     joined with "."
 * Do not change this format without also re-issuing every already-shipped
 * installer's embedded public key, since existing installs verify against
 * the ORIGINAL keypair from license-tool.
 */
export type LicenseType = "TRIAL" | "PERPETUAL";

export interface LicensePayload {
  customerName: string;
  licenseType: LicenseType;
  issuedDate: string; // yyyy-MM-dd
  expiryDate: string | null; // yyyy-MM-dd, null = PERPETUAL (never expires)
}

export interface IssueLicenseParams {
  licenseType: LicenseType;
  customerName: string;
  /** Only used for TRIAL licenses. Defaults to 14. */
  trialDays?: number;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10); // yyyy-MM-dd
}

/**
 * Builds the payload for a new license. Kept separate from signing so
 * both the trial route and the payment-webhook route can share this.
 */
export function buildLicensePayload(params: IssueLicenseParams): LicensePayload {
  const issuedDate = toDateOnly(new Date());
  let expiryDate: string | null = null;

  if (params.licenseType === "TRIAL") {
    const days = params.trialDays ?? 14;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    expiryDate = toDateOnly(expiry);
  }

  return {
    customerName: params.customerName,
    licenseType: params.licenseType,
    issuedDate,
    expiryDate,
  };
}

/** Serializes a payload to the exact pipe-delimited string the Java side signs/verifies. */
function serializePayload(payload: LicensePayload): string {
  return [
    payload.customerName,
    payload.licenseType,
    payload.issuedDate,
    payload.expiryDate ?? "",
  ].join("|");
}

/** Parses the pipe-delimited string back into a payload object. */
function parsePayload(raw: string): LicensePayload {
  const [customerName, licenseType, issuedDate, expiryDate] = raw.split("|");
  return {
    customerName,
    licenseType: licenseType as LicenseType,
    issuedDate,
    expiryDate: expiryDate ? expiryDate : null,
  };
}

/**
 * Encodes + signs a license payload into the final key string the user
 * pastes into the desktop app. Format: base64url(payload).base64url(signature)
 * matching LicenseKeyGenerator.java exactly.
 */
export function issueLicenseKey(payload: LicensePayload): string {
  const privateKey = loadSigningPrivateKey();
  const payloadRaw = serializePayload(payload);
  const payloadB64 = Buffer.from(payloadRaw, "utf8").toString("base64url");

  // Java signs the RAW payload bytes (before base64), not the base64 string.
  const signature = sign(null, Buffer.from(payloadRaw, "utf8"), privateKey);
  const signatureB64 = signature.toString("base64url");

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Local verification — NOT used by the desktop app (which does this
 * offline with its own embedded public key). This exists purely as a
 * sanity-check endpoint on this server so you can confirm a freshly
 * issued key is well-formed before it ever reaches a user.
 */
export function verifyLicenseKeyLocally(licenseKey: string): {
  valid: boolean;
  payload?: LicensePayload;
  reason?: string;
} {
  const parts = licenseKey.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "Malformed key (expected payload.signature)" };
  }
  const [payloadB64, signatureB64] = parts;

  let publicKey;
  try {
    publicKey = loadVerifyingPublicKey();
  } catch (err) {
    return { valid: false, reason: (err as Error).message };
  }

  const payloadRaw = Buffer.from(payloadB64, "base64url").toString("utf8");

  const signatureValid = verify(
    null,
    Buffer.from(payloadRaw, "utf8"),
    publicKey,
    Buffer.from(signatureB64, "base64url")
  );

  if (!signatureValid) {
    return { valid: false, reason: "Signature does not match — key is invalid or tampered" };
  }

  const payload = parsePayload(payloadRaw);

  if (payload.expiryDate && new Date(payload.expiryDate).getTime() < Date.now()) {
    return { valid: false, payload, reason: "License has expired" };
  }

  return { valid: true, payload };
}
