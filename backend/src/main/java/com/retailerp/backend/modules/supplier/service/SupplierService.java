package com.retailerp.backend.modules.supplier.service;

import com.retailerp.backend.modules.supplier.dto.SupplierDto;
import com.retailerp.backend.modules.supplier.dto.SupplierRequest;
import com.retailerp.backend.modules.supplier.entity.Supplier;
import com.retailerp.backend.modules.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<SupplierDto> listSuppliers(UUID tenantId) {
        return supplierRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public SupplierDto createSupplier(UUID tenantId, SupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setTenantId(tenantId);
        supplier.setName(request.name());
        supplier.setContact(request.contact());
        supplier.setGstin(request.gstin());
        return toDto(supplierRepository.save(supplier));
    }

    private SupplierDto toDto(Supplier supplier) {
        return new SupplierDto(supplier.getId(), supplier.getName(), supplier.getContact(), supplier.getGstin());
    }
}