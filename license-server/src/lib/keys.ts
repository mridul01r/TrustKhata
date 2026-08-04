import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";

/**
 * Loads the Ed25519 signing private key from the environment.
 * The value must be the base64 DER (pkcs8) string printed by
 * `npm run generate-keys`.
 */
export function loadSigningPrivateKey(): KeyObject {
  const raw = process.env.LICENSE_SIGNING_PRIVATE_KEY;
  if (!raw) {
    throw new Error(
      "LICENSE_SIGNING_PRIVATE_KEY is not set. Run `npm run generate-keys` " +
        "and put the printed private key into your .env file."
    );
  }

  return createPrivateKey({
    key: Buffer.from(raw, "base64"),
    format: "der",
    type: "pkcs8",
  });
}

/**
 * Loads the matching public key — only needed here for the local
 * self-verify sanity check (POST /debug/verify). The desktop app keeps
 * its own copy of this public key embedded at build time; it does not
 * call this server to verify licenses (offline-first).
 */
export function loadVerifyingPublicKey(): KeyObject {
  const raw = process.env.LICENSE_SIGNING_PUBLIC_KEY;
  if (!raw) {
    throw new Error(
      "LICENSE_SIGNING_PUBLIC_KEY is not set. Run `npm run generate-keys` " +
        "and put the printed public key into your .env file."
    );
  }

  return createPublicKey({
    key: Buffer.from(raw, "base64"),
    format: "der",
    type: "spki",
  });
}
