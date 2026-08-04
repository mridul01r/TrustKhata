package com.retailerp.backend.modules.license;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDate;
import java.util.Base64;
import org.springframework.stereotype.Component;

@Component
public class LicenseVerifier {

    // Public key from the standalone LicenseKeyGenerator tool - safe to keep here.
    // Only the private key (never present in this codebase) can forge a valid signature.
    private static final String PUBLIC_KEY_B64 =
            "MCowBQYDK2VwAyEAdjfwXXUYRHcCkK6RZTpdWYy4T5UT5YZGkF+SStjgXmc=";

    private final PublicKey publicKey;

    public LicenseVerifier() {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(PUBLIC_KEY_B64);
            KeyFactory keyFactory = KeyFactory.getInstance("Ed25519");
            this.publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(keyBytes));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load license public key", e);
        }
    }

    /**
     * Verifies a raw license key string (format: "<base64url-payload>.<base64url-signature>").
     * Throws LicenseInvalidException if the signature doesn't match or the format is malformed.
     */
    public LicensePayload verify(String licenseKey) {
        if (licenseKey == null || licenseKey.isBlank()) {
            throw new LicenseInvalidException("License key is empty");
        }

        String[] parts = licenseKey.trim().split("\\.", 2);
        if (parts.length != 2) {
            throw new LicenseInvalidException("Malformed license key");
        }

        byte[] payloadBytes;
        byte[] signatureBytes;
        try {
            payloadBytes = Base64.getUrlDecoder().decode(parts[0]);
            signatureBytes = Base64.getUrlDecoder().decode(parts[1]);
        } catch (IllegalArgumentException e) {
            throw new LicenseInvalidException("Malformed license key encoding");
        }

        try {
            Signature signature = Signature.getInstance("Ed25519");
            signature.initVerify(publicKey);
            signature.update(payloadBytes);
            if (!signature.verify(signatureBytes)) {
                throw new LicenseInvalidException("License key signature does not match");
            }
        } catch (LicenseInvalidException e) {
            throw e;
        } catch (Exception e) {
            throw new LicenseInvalidException("Failed to verify license signature");
        }

        String payload = new String(payloadBytes, StandardCharsets.UTF_8);
        String[] fields = payload.split("\\|", -1);
        if (fields.length != 4) {
            throw new LicenseInvalidException("Malformed license payload");
        }

        String customerName = fields[0];
        LicenseType type;
        try {
            type = LicenseType.valueOf(fields[1]);
        } catch (IllegalArgumentException e) {
            throw new LicenseInvalidException("Unknown license type");
        }
        LocalDate issuedDate = LocalDate.parse(fields[2]);
        LocalDate expiryDate = fields[3].isBlank() ? null : LocalDate.parse(fields[3]);

        return new LicensePayload(customerName, type, issuedDate, expiryDate);
    }
}