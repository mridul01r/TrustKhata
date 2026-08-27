package com.retailerp.backend.modules.reports.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class SalesAnalyticsRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Object[]> findBestSellingProducts(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT CAST(si.product_id AS VARCHAR), si.product_name, SUM(si.quantity), SUM(si.line_total)
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.tenant_id = ?
                  AND s.created_at BETWEEN ? AND ?
                GROUP BY si.product_id, si.product_name
                ORDER BY SUM(si.quantity) DESC
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter(1, tenantId)
                .setParameter(2, start)
                .setParameter(3, end)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> findSalesByCategory(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT CAST(p.category_id AS VARCHAR), COALESCE(c.name, 'Uncategorized'), SUM(si.quantity), SUM(si.line_total)
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                JOIN products p ON si.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE s.tenant_id = ?
                  AND s.created_at BETWEEN ? AND ?
                GROUP BY p.category_id, c.name
                ORDER BY SUM(si.line_total) DESC
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter(1, tenantId)
                .setParameter(2, start)
                .setParameter(3, end)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> findSalesByDay(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT CAST(created_at AS DATE) AS sale_date, SUM(total_amount), COUNT(*)
                FROM sales
                WHERE tenant_id = ?
                  AND created_at BETWEEN ? AND ?
                GROUP BY CAST(created_at AS DATE)
                ORDER BY sale_date
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter(1, tenantId)
                .setParameter(2, start)
                .setParameter(3, end)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> findSalesByHour(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT HOUR(created_at) AS sale_hour, SUM(total_amount), COUNT(*)
                FROM sales
                WHERE tenant_id = ?
                  AND created_at BETWEEN ? AND ?
                GROUP BY HOUR(created_at)
                ORDER BY sale_hour
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter(1, tenantId)
                .setParameter(2, start)
                .setParameter(3, end)
                .getResultList();
    }
}