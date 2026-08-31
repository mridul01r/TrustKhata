package com.retailerp.backend.modules.auth.repository;

import com.retailerp.backend.modules.auth.entity.User;
import com.retailerp.backend.modules.auth.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByTenantIdAndUsername(UUID tenantId, String username);

    Optional<User> findByEmail(String email);

    boolean existsByTenantIdAndUsername(UUID tenantId, String username);

    boolean existsByEmail(String email);

    List<User> findByTenantId(UUID tenantId);

    Optional<User> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantIdAndRoleNot(UUID tenantId, UserRole role);
}