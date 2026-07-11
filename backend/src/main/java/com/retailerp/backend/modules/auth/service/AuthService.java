package com.retailerp.backend.modules.auth.service;

import com.retailerp.backend.config.JwtService;
import com.retailerp.backend.modules.auth.dto.LoginRequest;
import com.retailerp.backend.modules.auth.dto.LoginResponse;
import com.retailerp.backend.modules.auth.entity.User;
import com.retailerp.backend.modules.auth.exception.InvalidCredentialsException;
import com.retailerp.backend.modules.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(UUID tenantId, LoginRequest request) {
        User user = userRepository.findByTenantIdAndUsername(tenantId, request.getUsername())
                .orElseThrow(InvalidCredentialsException::new);

        if (!user.isActive()) {
            throw new InvalidCredentialsException();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getUsername(),
                user.getTenantId(),
                user.getRole().name()
        );

        return new LoginResponse(token, user.getId(), user.getUsername(), user.getRole(), user.getTenantId());
    }
}