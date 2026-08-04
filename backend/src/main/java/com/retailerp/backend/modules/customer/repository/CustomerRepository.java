package com.retailerp.backend.modules.customer.repository;

import com.retailerp.backend.modules.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    List<Customer> findByTenantIdOrderByNameAsc(UUID tenantId);

    Optional<Customer> findByIdAndTenantId(UUID id, UUID tenantId);
}