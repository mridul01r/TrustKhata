package com.retailerp.backend.modules.license;

import com.retailerp.backend.modules.license.dto.LicenseStatusResponse;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class LicenseService {

    private final LicenseActivationRepository repository;
    private final LicenseVerifier verifier;

    public LicenseService(LicenseActivationRepository repository, LicenseVerifier verifier) {
        this.repository = repository;
        this.verifier = verifier;
    }

    public LicenseStatusResponse activate(String rawLicenseKey) {
        LicensePayload payload = verifier.verify(rawLicenseKey); // throws if bad signature/format
        if (payload.isExpired()) {
            throw new LicenseInvalidException("This license key has expired");
        }
        repository.deleteAll();
        repository.save(new LicenseActivation(rawLicenseKey, Instant.now()));
        return toResponse(payload);
    }

    public LicenseStatusResponse status() {
        return repository.findTopByOrderByActivatedAtDesc()
                .map(activation -> {
                    try {
                        LicensePayload payload = verifier.verify(activation.getLicenseKey());
                        if (payload.isExpired()) {
                            return new LicenseStatusResponse(false, "License expired",
                                    payload.customerName(), payload.type().name(), payload.expiryDate());
                        }
                        return toResponse(payload);
                    } catch (LicenseInvalidException e) {
                        return new LicenseStatusResponse(false, e.getMessage(), null, null, null);
                    }
                })
                .orElse(new LicenseStatusResponse(false, "No license activated", null, null, null));
    }

    /** Used by the request-blocking filter - always re-verifies from scratch, never trusts a cached flag. */
    public boolean isLicensed() {
        return status().valid();
    }

    private LicenseStatusResponse toResponse(LicensePayload payload) {
        return new LicenseStatusResponse(true, null, payload.customerName(), payload.type().name(), payload.expiryDate());
    }
}