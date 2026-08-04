package com.retailerp.backend.modules.customer.dto;

import java.util.List;

public class CustomerHistoryResponse {

    private final CustomerResponse customer;
    private final List<SaleSummaryDto> purchases;
    private final List<CustomerPaymentResponse> payments;

    public CustomerHistoryResponse(CustomerResponse customer, List<SaleSummaryDto> purchases,
                                    List<CustomerPaymentResponse> payments) {
        this.customer = customer;
        this.purchases = purchases;
        this.payments = payments;
    }

    public CustomerResponse getCustomer() {
        return customer;
    }

    public List<SaleSummaryDto> getPurchases() {
        return purchases;
    }

    public List<CustomerPaymentResponse> getPayments() {
        return payments;
    }
}