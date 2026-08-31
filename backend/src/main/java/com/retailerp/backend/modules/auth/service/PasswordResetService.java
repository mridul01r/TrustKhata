package com.retailerp.backend.modules.auth.service;

import com.retailerp.backend.modules.auth.dto.PasswordResetConfirmRequest;
import com.retailerp.backend.modules.auth.dto.PasswordResetRequest;
import com.retailerp.backend.modules.auth.entity.PasswordResetToken;
import com.retailerp.backend.modules.auth.entity.User;
import com.retailerp.backend.modules.auth.exception.InvalidCredentialsException;
import com.retailerp.backend.modules.auth.exception.TokenExpiredException;
import com.retailerp.backend.modules.auth.exception.TokenInvalidException;
import com.retailerp.backend.modules.auth.repository.PasswordResetTokenRepository;
import com.retailerp.backend.modules.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    private static final int TOKEN_EXPIRY_HOURS = 1;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String requestPasswordReset(PasswordResetRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException());

        // Delete any existing unused tokens for this user
        tokenRepository.deleteByUserId(user.getId());

        // Generate secure token
        byte[] tokenBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String tokenHash = hashToken(token);

        // Create and save token
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenHash);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS));

        tokenRepository.save(resetToken);

        return token;
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        String token = request.getToken();
        String tokenHash = hashToken(token);

        PasswordResetToken resetToken = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(TokenInvalidException::new);

        if (resetToken.isUsed()) {
            throw new TokenInvalidException();
        }

        if (resetToken.isExpired()) {
            throw new TokenExpiredException();
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsedAt(LocalDateTime.now());
        tokenRepository.save(resetToken);
    }

    private String hashToken(String token) {
        // Simple hash - in production consider using a proper key derivation function
        return Base64.getEncoder().encodeToString(token.getBytes());
    }
}