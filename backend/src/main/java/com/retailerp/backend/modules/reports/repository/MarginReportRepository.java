package com.retailerp.backend.modules.reports.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class MarginReportRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Object[]> findMarginByProduct(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT
                    CAST(si.product_id AS VARCHAR),
                    si.product_name,
                    SUM(si.quantity),
                    SUM(si.line_subtotal),
                    SUM(CASE WHEN si.purchase_price IS NOT NULL THEN si.purchase_price * si.quantity ELSE 0 END),
                    COUNT(CASE WHEN si.purchase_price IS NULL THEN 1 END)
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.tenant_id = CAST(:tenantId AS uuid)
                  AND s.created_at BETWEEN :start AND :end
                GROUP BY si.product_id, si.product_name
                ORDER BY SUM(si.line_subtotal) DESC
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> findMarginByCategory(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT
                    CAST(p.category_id AS VARCHAR),
                    COALESCE(c.name, 'Uncategorized'),
                    SUM(si.line_subtotal),
                    SUM(CASE WHEN si.purchase_price IS NOT NULL THEN si.purchase_price * si.quantity ELSE 0 END),
                    COUNT(CASE WHEN si.purchase_price IS NULL THEN 1 END)
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                JOIN products p ON si.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE s.tenant_id = CAST(:tenantId AS uuid)
                  AND s.created_at BETWEEN :start AND :end
                GROUP BY p.category_id, c.name
                ORDER BY SUM(si.line_subtotal) DESC
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }
}