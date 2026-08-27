package com.retailerp.backend.modules.pos.service;

import com.retailerp.backend.modules.pos.dto.HeldSaleItemDto;
import com.retailerp.backend.modules.pos.dto.HeldSaleRequest;
import com.retailerp.backend.modules.pos.dto.HeldSaleResponse;
import com.retailerp.backend.modules.pos.entity.HeldSale;
import com.retailerp.backend.modules.pos.exception.HeldSaleNotFoundException;
import com.retailerp.backend.modules.pos.repository.HeldSaleRepository;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.UUID;

@Service
public class HeldSaleService {

    private final HeldSaleRepository heldSaleRepository;
    private final ObjectMapper jsonMapper;

    public HeldSaleService(HeldSaleRepository heldSaleRepository, ObjectMapper jsonMapper) {
        this.heldSaleRepository = heldSaleRepository;
        this.jsonMapper = jsonMapper;
    }

    public HeldSaleResponse holdSale(UUID tenantId, UUID userId, HeldSaleRequest request) {
        HeldSale heldSale = new HeldSale();
        heldSale.setTenantId(tenantId);
        heldSale.setCreatedBy(userId);
        heldSale.setCustomerId(request.getCustomerId());
        heldSale.setInterstate(request.isInterstate());
        try {
            heldSale.setItems(jsonMapper.writeValueAsString(request.getItems()));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to serialize held sale items", e);
        }
        heldSale.setLabel(normalizeLabel(request.getLabel()));

        HeldSale saved = heldSaleRepository.save(heldSale);
        return toResponse(saved);
    }

    public List<HeldSaleResponse> listHeldSales(UUID tenantId) {
        return heldSaleRepository.findByTenantIdOrderByCreatedAtAsc(tenantId).stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteHeldSale(UUID tenantId, UUID id) {
        HeldSale heldSale = heldSaleRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new HeldSaleNotFoundException(id));
        heldSaleRepository.delete(heldSale);
    }

    private List<HeldSaleItemDto> deserializeItems(String json) {
        try {
            return jsonMapper.readValue(json, new TypeReference<List<HeldSaleItemDto>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to deserialize held sale items", e);
        }
    }

    private HeldSaleResponse toResponse(HeldSale heldSale) {
        HeldSaleResponse response = new HeldSaleResponse();
        response.setId(heldSale.getId());
        response.setItems(deserializeItems(heldSale.getItems()));
        response.setCustomerId(heldSale.getCustomerId());
        response.setInterstate(heldSale.isInterstate());
        response.setLabel(heldSale.getLabel());
        response.setCreatedAt(heldSale.getCreatedAt());
        return response;
    }

    /** Treats blank/whitespace-only labels as unset, so the frontend can show "Untitled" consistently. */
    private String normalizeLabel(String label) {
        if (label == null || label.isBlank()) {
            return null;
        }
        return label.trim();
    }
}