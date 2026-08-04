package com.retailerp.backend.modules.license;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LicenseActivationRepository extends JpaRepository<LicenseActivation, Long> {
    Optional<LicenseActivation> findTopByOrderByActivatedAtDesc();
}