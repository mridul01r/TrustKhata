package com.retailerp.backend.modules.auth.service;

import com.retailerp.backend.modules.auth.dto.ResetPasswordRequest;
import com.retailerp.backend.modules.auth.dto.StaffRequest;
import com.retailerp.backend.modules.auth.dto.StaffResponse;
import com.retailerp.backend.modules.auth.dto.StaffUpdateRequest;
import com.retailerp.backend.modules.auth.entity.User;
import com.retailerp.backend.modules.auth.entity.UserRole;
import com.retailerp.backend.modules.auth.exception.OwnerCannotBeDeletedException;
import com.retailerp.backend.modules.auth.exception.StaffHasSalesException;
import com.retailerp.backend.modules.auth.exception.StaffLimitExceededException;
import com.retailerp.backend.modules.auth.exception.StaffNotFoundException;
import com.retailerp.backend.modules.auth.exception.UsernameAlreadyExistsException;
import com.retailerp.backend.modules.auth.repository.UserRepository;
import com.retailerp.backend.modules.pos.repository.SaleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class StaffService {

    private final UserRepository userRepository;
    private final SaleRepository saleRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffService(UserRepository userRepository, SaleRepository saleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.saleRepository = saleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<StaffResponse> listStaff(UUID tenantId) {
        return userRepository.findByTenantId(tenantId).stream()
                .map(StaffResponse::fromEntity)
                .toList();
    }

    public StaffResponse createStaff(UUID tenantId, StaffRequest request) {
        if (userRepository.existsByTenantIdAndUsername(tenantId, request.getUsername())) {
            throw new UsernameAlreadyExistsException(request.getUsername());
        }

        long existingStaffCount = userRepository.countByTenantIdAndRoleNot(tenantId, UserRole.OWNER);
        if (existingStaffCount >= 3) {
            throw new StaffLimitExceededException();
        }

        User user = new User();
        user.setTenantId(tenantId);
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);

        User saved = userRepository.save(user);
        return StaffResponse.fromEntity(saved);
    }

    public StaffResponse updateStaff(UUID tenantId, UUID id, StaffUpdateRequest request) {
        User user = userRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new StaffNotFoundException(id));

        if (!user.getUsername().equalsIgnoreCase(request.getUsername())
                && userRepository.existsByTenantIdAndUsername(tenantId, request.getUsername())) {
            throw new UsernameAlreadyExistsException(request.getUsername());
        }

        user.setUsername(request.getUsername());
        user.setActive(request.isActive());

        User saved = userRepository.save(user);
        return StaffResponse.fromEntity(saved);
    }

    public void resetPassword(UUID tenantId, UUID id, ResetPasswordRequest request) {
        User user = userRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new StaffNotFoundException(id));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void deleteStaff(UUID tenantId, UUID id) {
        User user = userRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new StaffNotFoundException(id));

        if (user.getRole() == UserRole.OWNER) {
            throw new OwnerCannotBeDeletedException();
        }

        if (saleRepository.existsByTenantIdAndCreatedBy(tenantId, id)) {
            throw new StaffHasSalesException();
        }

        userRepository.delete(user);
    }
}