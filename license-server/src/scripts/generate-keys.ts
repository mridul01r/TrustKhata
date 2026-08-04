/**
 * One-time script to generate a fresh Ed25519 keypair for license signing.
 *
 * Run with: npm run generate-keys
 *
 * Output:
 *  - Prints the PRIVATE key (base64) — goes into this server's .env as
 *    LICENSE_SIGNING_PRIVATE_KEY. NEVER commit this. NEVER share it.
 *  - Prints the PUBLIC key (base64) — this goes into the DESKTOP APP
 *    (the offline verifier embedded in the Tauri/Spring Boot app), since
 *    that's what checks a license key is genuine without needing internet.
 */
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");

const privateKeyRaw = privateKey
  .export({ type: "pkcs8", format: "der" })
  .toString("base64");

const publicKeyRaw = publicKey
  .export({ type: "spki", format: "der" })
  .toString("base64");

console.log("\n=== Ed25519 keypair generated ===\n");
console.log("PRIVATE KEY (put in license-server .env as LICENSE_SIGNING_PRIVATE_KEY):");
console.log(privateKeyRaw);
console.log("\nPUBLIC KEY (embed in the desktop app's license verifier):");
console.log(publicKeyRaw);
console.log("\n==================================\n");
console.log("Store the private key somewhere safe (password manager) in addition");
console.log("to the .env file. If it's ever lost, every previously-issued license");
console.log("key still works (verification only needs the public key), but you");
console.log("won't be able to issue NEW valid licenses without generating a new");
console.log("keypair and updating the public key in every future app release.\n");
