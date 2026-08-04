package com.retailerp.backend.modules.accounting.repository;

import com.retailerp.backend.modules.accounting.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    List<Expense> findByTenantIdAndExpenseDateBetweenOrderByExpenseDateDesc(
            UUID tenantId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.tenantId = :tenantId AND e.expenseDate BETWEEN :from AND :to")
    java.math.BigDecimal sumByTenantAndDateRange(
            @Param("tenantId") UUID tenantId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT e.categoryId, COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.tenantId = :tenantId AND e.expenseDate BETWEEN :from AND :to " +
           "GROUP BY e.categoryId")
    List<Object[]> sumByCategoryAndDateRange(
            @Param("tenantId") UUID tenantId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}