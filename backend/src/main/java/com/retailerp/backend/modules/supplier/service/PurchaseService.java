package com.retailerp.backend.modules.supplier.service;

import com.retailerp.backend.modules.inventory.entity.Product;
import com.retailerp.backend.modules.inventory.repository.ProductRepository;
import com.retailerp.backend.modules.supplier.dto.*;
import com.retailerp.backend.modules.supplier.entity.Purchase;
import com.retailerp.backend.modules.supplier.entity.PurchaseItem;
import com.retailerp.backend.modules.supplier.entity.Supplier;
import com.retailerp.backend.modules.supplier.exception.PurchaseNotFoundException;
import com.retailerp.backend.modules.supplier.exception.SupplierNotFoundException;
import com.retailerp.backend.modules.supplier.repository.PurchaseRepository;
import com.retailerp.backend.modules.supplier.repository.SupplierRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;

    @Transactional
    public PurchaseResponse createPurchase(UUID tenantId, UUID userId, PurchaseRequest request) {
        Supplier supplier = supplierRepository.findById(request.supplierId())
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new SupplierNotFoundException("Supplier not found"));

        Purchase purchase = new Purchase();
        purchase.setTenantId(tenantId);
        purchase.setSupplierId(supplier.getId());
        purchase.setReferenceNumber(request.referenceNumber());
        purchase.setPurchaseDate(request.purchaseDate());
        purchase.setCreatedBy(userId);

        BigDecimal total = BigDecimal.ZERO;

        for (PurchaseItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .filter(p -> p.getTenantId().equals(tenantId))
                    .orElseThrow(() -> new EntityNotFoundException("Product not found: " + itemRequest.productId()));

            BigDecimal lineTotal = itemRequest.unitCost().multiply(itemRequest.quantity());

            PurchaseItem item = new PurchaseItem();
            item.setPurchase(purchase);
            item.setProductId(product.getId());
            item.setQuantity(itemRequest.quantity());
            item.setUnitCost(itemRequest.unitCost());
            item.setLineTotal(lineTotal);
            purchase.getItems().add(item);

            total = total.add(lineTotal);

            // Stock-in: increase quantity, update cost to latest purchase price
            product.setStockQuantity(product.getStockQuantity().add(itemRequest.quantity()));
            product.setPurchasePrice(itemRequest.unitCost());
            productRepository.save(product);
        }

        purchase.setTotalAmount(total);
        Purchase saved = purchaseRepository.save(purchase);
        return toResponse(saved, supplier.getName());
    }

    public List<PurchaseResponse> listPurchases(UUID tenantId, LocalDate from, LocalDate to) {
        List<Purchase> purchases = purchaseRepository
                .findByTenantIdAndPurchaseDateBetweenOrderByPurchaseDateDesc(tenantId, from, to);

        Map<UUID, String> supplierNames = supplierRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .collect(java.util.stream.Collectors.toMap(Supplier::getId, Supplier::getName));

        return purchases.stream()
                .map(p -> toResponse(p, supplierNames.getOrDefault(p.getSupplierId(), "Unknown")))
                .toList();
    }

    public PurchaseResponse getPurchase(UUID tenantId, UUID purchaseId) {
        Purchase purchase = purchaseRepository.findByIdAndTenantId(purchaseId, tenantId)
                .orElseThrow(() -> new PurchaseNotFoundException("Purchase not found"));
        String supplierName = supplierRepository.findById(purchase.getSupplierId())
                .map(Supplier::getName)
                .orElse("Unknown");
        return toResponse(purchase, supplierName);
    }

    private PurchaseResponse toResponse(Purchase purchase, String supplierName) {
        List<PurchaseItemResponse> items = purchase.getItems().stream()
                .map(item -> {
                    String productName = productRepository.findById(item.getProductId())
                            .map(Product::getName)
                            .orElse("Unknown");
                    return new PurchaseItemResponse(
                            item.getProductId(), productName, item.getQuantity(), item.getUnitCost(), item.getLineTotal());
                })
                .toList();

        return new PurchaseResponse(
                purchase.getId(),
                purchase.getSupplierId(),
                supplierName,
                purchase.getReferenceNumber(),
                purchase.getPurchaseDate(),
                purchase.getTotalAmount(),
                items
        );
    }
}