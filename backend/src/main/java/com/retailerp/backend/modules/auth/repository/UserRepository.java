package com.retailerp.backend.modules.auth.repository;

import com.retailerp.backend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByTenantIdAndUsername(UUID tenantId, String username);

    boolean existsByTenantIdAndUsername(UUID tenantId, String username);
}