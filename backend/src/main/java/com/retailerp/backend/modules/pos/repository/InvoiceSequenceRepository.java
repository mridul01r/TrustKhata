package com.retailerp.backend.modules.pos.repository;

import com.retailerp.backend.modules.pos.entity.InvoiceSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceSequenceRepository extends JpaRepository<InvoiceSequence, InvoiceSequence.InvoiceSequenceId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM InvoiceSequence s WHERE s.tenantId = :tenantId AND s.financialYear = :financialYear")
    Optional<InvoiceSequence> findForUpdate(@Param("tenantId") UUID tenantId, @Param("financialYear") String financialYear);
}