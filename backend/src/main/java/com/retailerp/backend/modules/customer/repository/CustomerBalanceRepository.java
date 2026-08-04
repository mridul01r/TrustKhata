package com.retailerp.backend.modules.customer.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public class CustomerBalanceRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Object[]> findCreditTotalsByCustomer(UUID tenantId) {
        String sql = """
                SELECT s.customer_id, SUM(sp.amount)
                FROM sale_payments sp
                JOIN sales s ON sp.sale_id = s.id
                WHERE s.tenant_id = CAST(:tenantId AS uuid)
                  AND sp.method = 'CREDIT'
                  AND s.customer_id IS NOT NULL
                GROUP BY s.customer_id
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> findPaidTotalsByCustomer(UUID tenantId) {
        String sql = """
                SELECT cp.customer_id, SUM(cp.amount)
                FROM customer_payments cp
                WHERE cp.tenant_id = CAST(:tenantId AS uuid)
                GROUP BY cp.customer_id
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .getResultList();
    }

    public BigDecimal findCreditTotalForCustomer(UUID tenantId, UUID customerId) {
        String sql = """
                SELECT COALESCE(SUM(sp.amount), 0)
                FROM sale_payments sp
                JOIN sales s ON sp.sale_id = s.id
                WHERE s.tenant_id = CAST(:tenantId AS uuid)
                  AND s.customer_id = CAST(:customerId AS uuid)
                  AND sp.method = 'CREDIT'
                """;
        return (BigDecimal) entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .setParameter("customerId", customerId.toString())
                .getSingleResult();
    }

    public BigDecimal findPaidTotalForCustomer(UUID tenantId, UUID customerId) {
        String sql = """
                SELECT COALESCE(SUM(cp.amount), 0)
                FROM customer_payments cp
                WHERE cp.tenant_id = CAST(:tenantId AS uuid)
                  AND cp.customer_id = CAST(:customerId AS uuid)
                """;
        return (BigDecimal) entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .setParameter("customerId", customerId.toString())
                .getSingleResult();
    }
}