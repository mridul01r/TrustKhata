package com.retailerp.backend.modules.license;

import com.retailerp.backend.modules.license.dto.ActivateLicenseRequest;
import com.retailerp.backend.modules.license.dto.LicenseStatusResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/license")
public class LicenseController {

    private final LicenseService licenseService;

    public LicenseController(LicenseService licenseService) {
        this.licenseService = licenseService;
    }

    @GetMapping("/status")
    public LicenseStatusResponse status() {
        return licenseService.status();
    }

    @PostMapping("/activate")
    public ResponseEntity<LicenseStatusResponse> activate(@RequestBody ActivateLicenseRequest request) {
        try {
            return ResponseEntity.ok(licenseService.activate(request.licenseKey()));
        } catch (LicenseInvalidException e) {
            return ResponseEntity.badRequest()
                    .body(new LicenseStatusResponse(false, e.getMessage(), null, null, null));
        }
    }
}