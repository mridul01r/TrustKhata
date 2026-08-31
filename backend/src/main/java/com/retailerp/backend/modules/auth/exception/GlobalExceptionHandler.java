package com.retailerp.backend.modules.auth.exception;

import com.retailerp.backend.modules.accounting.exception.DuplicateExpenseCategoryException;
import com.retailerp.backend.modules.accounting.exception.ExpenseCategoryNotFoundException;
import com.retailerp.backend.modules.accounting.exception.ExpenseNotFoundException;
import com.retailerp.backend.modules.inventory.exception.CategoryInUseException;
import com.retailerp.backend.modules.inventory.exception.CategoryNotFoundException;
import com.retailerp.backend.modules.inventory.exception.DuplicateCategoryNameException;
import com.retailerp.backend.modules.inventory.exception.DuplicateSkuException;
import com.retailerp.backend.modules.inventory.exception.ProductInUseException;
import com.retailerp.backend.modules.inventory.exception.ProductNotFoundException;
import com.retailerp.backend.modules.pos.exception.InsufficientStockException;
import com.retailerp.backend.modules.pos.exception.PaymentMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.retailerp.backend.modules.supplier.exception.SupplierNotFoundException;
import com.retailerp.backend.modules.supplier.exception.PurchaseNotFoundException;
import com.retailerp.backend.modules.customer.exception.CustomerNotFoundException;
import com.retailerp.backend.modules.customer.exception.PaymentExceedsBalanceException;
import com.retailerp.backend.modules.pos.exception.CreditRequiresCustomerException;
import com.retailerp.backend.modules.auth.exception.UsernameAlreadyExistsException;
import com.retailerp.backend.modules.pos.exception.HeldSaleNotFoundException;
import com.retailerp.backend.modules.auth.exception.StaffNotFoundException;
import com.retailerp.backend.modules.auth.exception.StaffLimitExceededException;
import com.retailerp.backend.modules.auth.exception.StaffHasSalesException;
import com.retailerp.backend.modules.auth.exception.OwnerCannotBeDeletedException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleCategoryNotFound(CategoryNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DuplicateCategoryNameException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateCategoryName(DuplicateCategoryNameException ex) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleProductNotFound(ProductNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DuplicateSkuException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateSku(DuplicateSkuException ex) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientStock(InsufficientStockException ex) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(PaymentMismatchException.class)
    public ResponseEntity<Map<String, Object>> handlePaymentMismatch(PaymentMismatchException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(ProductInUseException.class)
    public ResponseEntity<Map<String, String>> handleProductInUse(ProductInUseException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(CategoryInUseException.class)
    public ResponseEntity<Map<String, String>> handleCategoryInUse(CategoryInUseException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("errors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ExpenseCategoryNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleExpenseCategoryNotFound(ExpenseCategoryNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateExpenseCategoryException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateExpenseCategory(DuplicateExpenseCategoryException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(ExpenseNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleExpenseNotFound(ExpenseNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(SupplierNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleSupplierNotFound(SupplierNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(PurchaseNotFoundException.class)
    public ResponseEntity<Map<String, String>> handlePurchaseNotFound(PurchaseNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(CustomerNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleCustomerNotFound(CustomerNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(PaymentExceedsBalanceException.class)
    public ResponseEntity<Map<String, String>> handlePaymentExceedsBalance(PaymentExceedsBalanceException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(CreditRequiresCustomerException.class)
    public ResponseEntity<Map<String, String>> handleCreditRequiresCustomer(CreditRequiresCustomerException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(UsernameAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleUsernameAlreadyExists(UsernameAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(HeldSaleNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleHeldSaleNotFound(HeldSaleNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(StaffNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleStaffNotFound(StaffNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(StaffLimitExceededException.class)
    public ResponseEntity<Map<String, String>> handleStaffLimitExceeded(StaffLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(StaffHasSalesException.class)
    public ResponseEntity<Map<String, String>> handleStaffHasSales(StaffHasSalesException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(OwnerCannotBeDeletedException.class)
    public ResponseEntity<Map<String, String>> handleOwnerCannotBeDeleted(OwnerCannotBeDeletedException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(TokenInvalidException.class)
    public ResponseEntity<Map<String, String>> handleTokenInvalid(TokenInvalidException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<Map<String, String>> handleTokenExpired(TokenExpiredException ex) {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of("message", ex.getMessage()));
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}