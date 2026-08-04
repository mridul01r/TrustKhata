package com.retailerp.backend.modules.settings.service;

import com.retailerp.backend.modules.settings.dto.BusinessSettingsRequest;
import com.retailerp.backend.modules.settings.dto.BusinessSettingsResponse;
import com.retailerp.backend.modules.settings.entity.BusinessSettings;
import com.retailerp.backend.modules.settings.repository.BusinessSettingsRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class BusinessSettingsService {

    private final BusinessSettingsRepository repository;

    public BusinessSettingsService(BusinessSettingsRepository repository) {
        this.repository = repository;
    }

    public BusinessSettingsResponse get(UUID tenantId) {
        return repository.findById(tenantId)
                .map(BusinessSettingsResponse::fromEntity)
                .orElseGet(BusinessSettingsResponse::empty);
    }

    public BusinessSettingsResponse save(UUID tenantId, BusinessSettingsRequest request) {
        BusinessSettings settings = repository.findById(tenantId).orElseGet(() -> {
            BusinessSettings created = new BusinessSettings();
            created.setTenantId(tenantId);
            return created;
        });

        settings.setBusinessName(request.getBusinessName());
        settings.setGstin(request.getGstin());
        settings.setAddressLine1(request.getAddressLine1());
        settings.setAddressLine2(request.getAddressLine2());
        settings.setCity(request.getCity());
        settings.setState(request.getState());
        settings.setPincode(request.getPincode());
        settings.setPhone(request.getPhone());
        settings.setEmail(request.getEmail());
        settings.setTrackInventory(request.isTrackInventory());

        return BusinessSettingsResponse.fromEntity(repository.save(settings));
    }

    /**
     * Used by CheckoutService (and eventually Dashboard/Stock Report) to decide
     * whether stock quantities are meaningful for this tenant. Defaults to true
     * (today's behavior) if no settings row exists yet.
     */
    public boolean isTrackInventoryEnabled(UUID tenantId) {
        return repository.findById(tenantId)
                .map(BusinessSettings::isTrackInventory)
                .orElse(true);
    }
}