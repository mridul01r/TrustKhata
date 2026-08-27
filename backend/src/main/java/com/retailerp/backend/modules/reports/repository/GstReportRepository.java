package com.retailerp.backend.modules.reports.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class GstReportRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Object[]> findHsnSummary(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT
                    si.hsn_code,
                    si.unit,
                    si.gst_rate,
                    SUM(si.quantity),
                    SUM(si.line_subtotal),
                    SUM(CASE WHEN s.is_interstate THEN si.line_tax ELSE 0 END),
                    SUM(CASE WHEN NOT s.is_interstate THEN si.line_tax / 2 ELSE 0 END),
                    SUM(CASE WHEN NOT s.is_interstate THEN si.line_tax / 2 ELSE 0 END)
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.tenant_id = ?
                  AND s.created_at BETWEEN ? AND ?
                GROUP BY si.hsn_code, si.unit, si.gst_rate
                ORDER BY si.hsn_code
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter(1, tenantId)
                .setParameter(2, start)
                .setParameter(3, end)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> findTaxRateSummary(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT
                    si.gst_rate,
                    SUM(si.line_subtotal),
                    SUM(CASE WHEN s.is_interstate THEN si.line_tax ELSE 0 END),
                    SUM(CASE WHEN NOT s.is_interstate THEN si.line_tax / 2 ELSE 0 END),
                    SUM(CASE WHEN NOT s.is_interstate THEN si.line_tax / 2 ELSE 0 END)
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.tenant_id = ?
                  AND s.created_at BETWEEN ? AND ?
                GROUP BY si.gst_rate
                ORDER BY si.gst_rate
                """;
        return entityManager.createNativeQuery(sql)
                .setParameter(1, tenantId)
                .setParameter(2, start)
                .setParameter(3, end)
                .getResultList();
    }
}