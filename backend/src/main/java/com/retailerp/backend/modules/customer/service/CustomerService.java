package com.retailerp.backend.modules.customer.service;

import com.retailerp.backend.modules.customer.dto.*;
import com.retailerp.backend.modules.customer.entity.Customer;
import com.retailerp.backend.modules.customer.entity.CustomerPayment;
import com.retailerp.backend.modules.customer.exception.CustomerNotFoundException;
import com.retailerp.backend.modules.customer.exception.PaymentExceedsBalanceException;
import com.retailerp.backend.modules.customer.repository.CustomerBalanceRepository;
import com.retailerp.backend.modules.customer.repository.CustomerPaymentRepository;
import com.retailerp.backend.modules.customer.repository.CustomerRepository;
import com.retailerp.backend.modules.pos.entity.PaymentMethod;
import com.retailerp.backend.modules.pos.entity.Sale;
import com.retailerp.backend.modules.pos.entity.SaleItem;
import com.retailerp.backend.modules.pos.entity.SalePayment;
import com.retailerp.backend.modules.pos.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerPaymentRepository customerPaymentRepository;
    private final CustomerBalanceRepository customerBalanceRepository;
    private final SaleRepository saleRepository;

    public CustomerService(
            CustomerRepository customerRepository,
            CustomerPaymentRepository customerPaymentRepository,
            CustomerBalanceRepository customerBalanceRepository,
            SaleRepository saleRepository
    ) {
        this.customerRepository = customerRepository;
        this.customerPaymentRepository = customerPaymentRepository;
        this.customerBalanceRepository = customerBalanceRepository;
        this.saleRepository = saleRepository;
    }

    public CustomerResponse createCustomer(UUID tenantId, CustomerRequest request) {
        Customer customer = new Customer();
        customer.setTenantId(tenantId);
        applyRequest(customer, request);
        Customer saved = customerRepository.save(customer);
        return CustomerResponse.fromEntity(saved, BigDecimal.ZERO);
    }

    public CustomerResponse updateCustomer(UUID tenantId, UUID id, CustomerRequest request) {
        Customer customer = customerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new CustomerNotFoundException(id));
        applyRequest(customer, request);
        Customer saved = customerRepository.save(customer);
        BigDecimal balance = calculateBalance(tenantId, id);
        return CustomerResponse.fromEntity(saved, balance);
    }

    public List<CustomerResponse> listCustomers(UUID tenantId) {
        List<Customer> customers = customerRepository.findByTenantIdOrderByNameAsc(tenantId);

        Map<UUID, BigDecimal> creditTotals = toBalanceMap(customerBalanceRepository.findCreditTotalsByCustomer(tenantId));
        Map<UUID, BigDecimal> paidTotals = toBalanceMap(customerBalanceRepository.findPaidTotalsByCustomer(tenantId));

        return customers.stream()
                .map(c -> {
                    BigDecimal credit = creditTotals.getOrDefault(c.getId(), BigDecimal.ZERO);
                    BigDecimal paid = paidTotals.getOrDefault(c.getId(), BigDecimal.ZERO);
                    return CustomerResponse.fromEntity(c, credit.subtract(paid));
                })
                .toList();
    }

    @Transactional
    public CustomerHistoryResponse getHistory(UUID tenantId, UUID id) {
        Customer customer = customerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new CustomerNotFoundException(id));

        BigDecimal balance = calculateBalance(tenantId, id);
        CustomerResponse customerResponse = CustomerResponse.fromEntity(customer, balance);

        List<Sale> sales = saleRepository.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(tenantId, id);
        List<SaleSummaryDto> purchases = sales.stream()
                .map(sale -> {
                    BigDecimal creditPortion = sale.getPayments().stream()
                            .filter(p -> p.getMethod() == PaymentMethod.CREDIT)
                            .map(SalePayment::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new SaleSummaryDto(
                            sale.getId(),
                            sale.getInvoiceNumber(),
                            sale.getTotalAmount(),
                            creditPortion,
                            sale.getCreatedAt());
                })
                .toList();

        List<CustomerPaymentResponse> payments = customerPaymentRepository.findByCustomerIdOrderByCreatedAtDesc(id)
                .stream()
                .map(CustomerPaymentResponse::fromEntity)
                .toList();

        return new CustomerHistoryResponse(customerResponse, purchases, payments);
    }

    public CustomerPaymentResponse recordPayment(UUID tenantId, UUID customerId, UUID recordedBy, CustomerPaymentRequest request) {
        customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new CustomerNotFoundException(customerId));

        BigDecimal balance = calculateBalance(tenantId, customerId);
        if (request.getAmount().compareTo(balance) > 0) {
            throw new PaymentExceedsBalanceException(request.getAmount(), balance);
        }

        CustomerPayment payment = new CustomerPayment();
        payment.setTenantId(tenantId);
        payment.setCustomerId(customerId);
        payment.setAmount(request.getAmount());
        payment.setMethod(request.getMethod());
        payment.setNote(request.getNote());
        payment.setCreatedBy(recordedBy);

        CustomerPayment saved = customerPaymentRepository.save(payment);
        return CustomerPaymentResponse.fromEntity(saved);
    }

    private BigDecimal calculateBalance(UUID tenantId, UUID customerId) {
        BigDecimal credit = customerBalanceRepository.findCreditTotalForCustomer(tenantId, customerId);
        BigDecimal paid = customerBalanceRepository.findPaidTotalForCustomer(tenantId, customerId);
        return credit.subtract(paid);
    }

    private Map<UUID, BigDecimal> toBalanceMap(List<Object[]> rows) {
        Map<UUID, BigDecimal> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((UUID) row[0], (BigDecimal) row[1]);
        }
        return map;
    }

    private void applyRequest(Customer customer, CustomerRequest request) {
        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setGstin(request.getGstin());
    }
}