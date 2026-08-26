package com.retailerp.backend.modules.reports.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class StockReportRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Object[]> findValuation(UUID tenantId) {
        String sql = """
                SELECT
                    CAST(p.id AS VARCHAR),
                    p.name,
                    COALESCE(c.name, 'Uncategorized'),
                    p.unit,
                    p.stock_quantity,
                    p.purchase_price,
                    (p.stock_quantity * p.purchase_price)
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.tenant_id = CAST(:tenantId AS uuid)
                  AND p.is_active = true
                ORDER BY (p.stock_quantity * p.purchase_price) DESC
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> findLowStock(UUID tenantId) {
        String sql = """
                SELECT CAST(p.id AS VARCHAR), p.name, p.unit, p.stock_quantity, p.reorder_level
                FROM products p
                WHERE p.tenant_id = CAST(:tenantId AS uuid)
                  AND p.is_active = true
                  AND p.stock_quantity <= p.reorder_level
                ORDER BY p.stock_quantity ASC
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> findDeadStock(UUID tenantId, LocalDateTime cutoff) {
        String sql = """
                SELECT CAST(p.id AS VARCHAR), p.name, p.unit, p.stock_quantity, MAX(s.created_at)
                FROM products p
                LEFT JOIN sale_items si ON si.product_id = p.id
                LEFT JOIN sales s ON s.id = si.sale_id AND s.tenant_id = CAST(:tenantId AS uuid)
                WHERE p.tenant_id = CAST(:tenantId AS uuid)
                  AND p.is_active = true
                  AND p.stock_quantity > 0
                GROUP BY p.id, p.name, p.unit, p.stock_quantity
                HAVING MAX(s.created_at) IS NULL OR MAX(s.created_at) < :cutoff
                ORDER BY MAX(s.created_at) ASC NULLS FIRST
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter("tenantId", tenantId.toString())
                .setParameter("cutoff", cutoff)
                .getResultList();
    }
}