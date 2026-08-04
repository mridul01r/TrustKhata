package com.retailerp.backend.modules.pos.service;

import com.retailerp.backend.modules.customer.entity.Customer;
import com.retailerp.backend.modules.customer.exception.CustomerNotFoundException;
import com.retailerp.backend.modules.customer.repository.CustomerRepository;
import com.retailerp.backend.modules.inventory.entity.Product;
import com.retailerp.backend.modules.inventory.exception.ProductNotFoundException;
import com.retailerp.backend.modules.inventory.repository.ProductRepository;
import com.retailerp.backend.modules.pos.dto.CheckoutRequest;
import com.retailerp.backend.modules.pos.dto.SaleResponse;
import com.retailerp.backend.modules.pos.entity.PaymentMethod;
import com.retailerp.backend.modules.pos.entity.Sale;
import com.retailerp.backend.modules.pos.entity.SaleItem;
import com.retailerp.backend.modules.pos.entity.SalePayment;
import com.retailerp.backend.modules.pos.exception.CreditRequiresCustomerException;
import com.retailerp.backend.modules.pos.exception.InsufficientStockException;
import com.retailerp.backend.modules.pos.exception.PaymentMismatchException;
import com.retailerp.backend.modules.pos.repository.SaleRepository;
import com.retailerp.backend.modules.settings.service.BusinessSettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class CheckoutService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final InvoiceNumberService invoiceNumberService;
    private final CustomerRepository customerRepository;
    private final BusinessSettingsService businessSettingsService;

    public CheckoutService(
            ProductRepository productRepository,
            SaleRepository saleRepository,
            InvoiceNumberService invoiceNumberService,
            CustomerRepository customerRepository,
            BusinessSettingsService businessSettingsService
    ) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.invoiceNumberService = invoiceNumberService;
        this.customerRepository = customerRepository;
        this.businessSettingsService = businessSettingsService;
    }

    @Transactional
    public SaleResponse checkout(UUID tenantId, UUID cashierId, CheckoutRequest request) {
        boolean trackInventory = businessSettingsService.isTrackInventoryEnabled(tenantId);

        Sale sale = new Sale();
        sale.setTenantId(tenantId);
        sale.setCreatedBy(cashierId);
        sale.setInterstate(request.isInterstate());

        boolean hasCreditPayment = request.getPayments().stream()
                .anyMatch(p -> p.getMethod() == PaymentMethod.CREDIT);

        if (hasCreditPayment && request.getCustomerId() == null) {
            throw new CreditRequiresCustomerException();
        }

        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findByIdAndTenantId(request.getCustomerId(), tenantId)
                    .orElseThrow(() -> new CustomerNotFoundException(request.getCustomerId()));
            sale.setCustomerId(customer.getId());
            sale.setCustomerName(customer.getName());
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (CheckoutRequest.CheckoutItem itemRequest : request.getItems()) {
            Product product = productRepository.findByIdAndTenantId(itemRequest.getProductId(), tenantId)
                    .orElseThrow(() -> new ProductNotFoundException(itemRequest.getProductId()));

            BigDecimal quantity = itemRequest.getQuantity();

            if (trackInventory) {
                if (product.getStockQuantity().compareTo(quantity) < 0) {
                    throw new InsufficientStockException(product.getName(), product.getStockQuantity(), quantity);
                }
            }

            BigDecimal lineSubtotal = product.getSellingPrice().multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTax = lineSubtotal
                    .multiply(product.getGstRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(lineTax);

            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setProductId(product.getId());
            saleItem.setProductName(product.getName());
            saleItem.setHsnCode(product.getHsnCode());
            saleItem.setUnit(product.getUnit());
            saleItem.setQuantity(quantity);
            saleItem.setUnitPrice(product.getSellingPrice());
            saleItem.setPurchasePrice(product.getPurchasePrice());
            saleItem.setGstRate(product.getGstRate());
            saleItem.setLineSubtotal(lineSubtotal);
            saleItem.setLineTax(lineTax);
            saleItem.setLineTotal(lineTotal);
            sale.getItems().add(saleItem);

            if (trackInventory) {
                product.setStockQuantity(product.getStockQuantity().subtract(quantity));
                productRepository.save(product);
            }

            subtotal = subtotal.add(lineSubtotal);
            taxTotal = taxTotal.add(lineTax);
        }

        BigDecimal totalAmount = subtotal.add(taxTotal);

        BigDecimal paidAmount = request.getPayments().stream()
                .map(CheckoutRequest.CheckoutPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (paidAmount.setScale(2, RoundingMode.HALF_UP).compareTo(totalAmount.setScale(2, RoundingMode.HALF_UP)) != 0) {
            throw new PaymentMismatchException(totalAmount, paidAmount);
        }

        for (CheckoutRequest.CheckoutPayment paymentRequest : request.getPayments()) {
            SalePayment payment = new SalePayment();
            payment.setSale(sale);
            payment.setMethod(paymentRequest.getMethod());
            payment.setAmount(paymentRequest.getAmount());
            sale.getPayments().add(payment);
        }

        sale.setSubtotal(subtotal);
        sale.setTaxTotal(taxTotal);
        sale.setTotalAmount(totalAmount);
        sale.setInvoiceNumber(invoiceNumberService.nextInvoiceNumber(tenantId));

        Sale savedSale = saleRepository.save(sale);
        return SaleResponse.fromEntity(savedSale);
    }
}