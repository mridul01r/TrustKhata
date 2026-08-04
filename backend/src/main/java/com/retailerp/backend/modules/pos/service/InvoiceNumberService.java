package com.retailerp.backend.modules.pos.service;

import com.retailerp.backend.modules.pos.entity.InvoiceSequence;
import com.retailerp.backend.modules.pos.repository.InvoiceSequenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class InvoiceNumberService {

    private final InvoiceSequenceRepository invoiceSequenceRepository;

    public InvoiceNumberService(InvoiceSequenceRepository invoiceSequenceRepository) {
        this.invoiceSequenceRepository = invoiceSequenceRepository;
    }

    /**
     * Atomically reserves and returns the next invoice number for this tenant's
     * current Indian financial year (Apr-Mar), formatted like INV/FY2526/000001.
     * Runs in its own transaction (REQUIRES_NEW) so the row lock is held only
     * briefly, not for the whole checkout transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String nextInvoiceNumber(UUID tenantId) {
        String financialYear = currentFinancialYear();

        InvoiceSequence sequence = invoiceSequenceRepository
                .findForUpdate(tenantId, financialYear)
                .orElseGet(() -> {
                    InvoiceSequence created = new InvoiceSequence();
                    created.setTenantId(tenantId);
                    created.setFinancialYear(financialYear);
                    created.setNextNumber(1);
                    return invoiceSequenceRepository.save(created);
                });

        int number = sequence.getNextNumber();
        sequence.setNextNumber(number + 1);
        invoiceSequenceRepository.save(sequence);

        return String.format("INV/%s/%06d", financialYear, number);
    }

    private String currentFinancialYear() {
        LocalDate now = LocalDate.now();
        int startYear = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        int endYear = startYear + 1;
        return String.format("FY%02d%02d", startYear % 100, endYear % 100);
    }
}