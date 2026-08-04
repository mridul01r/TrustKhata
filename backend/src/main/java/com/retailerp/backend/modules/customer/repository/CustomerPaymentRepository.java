package com.retailerp.backend.modules.customer.repository;

import com.retailerp.backend.modules.customer.entity.CustomerPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CustomerPaymentRepository extends JpaRepository<CustomerPayment, UUID> {

    List<CustomerPayment> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}