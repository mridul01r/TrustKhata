package com.retailerp.backend.modules.pos.entity;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "invoice_sequences")
@IdClass(InvoiceSequence.InvoiceSequenceId.class)
public class InvoiceSequence {

    @Id
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Id
    @Column(name = "financial_year", length = 9)
    private String financialYear;

    @Column(name = "next_number", nullable = false)
    private int nextNumber = 1;

    public InvoiceSequence() {
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public String getFinancialYear() {
        return financialYear;
    }

    public void setFinancialYear(String financialYear) {
        this.financialYear = financialYear;
    }

    public int getNextNumber() {
        return nextNumber;
    }

    public void setNextNumber(int nextNumber) {
        this.nextNumber = nextNumber;
    }

    public static class InvoiceSequenceId implements Serializable {
        private UUID tenantId;
        private String financialYear;

        public InvoiceSequenceId() {
        }

        public InvoiceSequenceId(UUID tenantId, String financialYear) {
            this.tenantId = tenantId;
            this.financialYear = financialYear;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof InvoiceSequenceId that)) return false;
            return Objects.equals(tenantId, that.tenantId) && Objects.equals(financialYear, that.financialYear);
        }

        @Override
        public int hashCode() {
            return Objects.hash(tenantId, financialYear);
        }
    }
}