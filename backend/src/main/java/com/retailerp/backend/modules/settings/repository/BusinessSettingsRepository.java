package com.retailerp.backend.modules.settings.repository;

import com.retailerp.backend.modules.settings.entity.BusinessSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BusinessSettingsRepository extends JpaRepository<BusinessSettings, UUID> {
}