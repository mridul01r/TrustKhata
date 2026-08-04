package com.retailerp.backend.modules.auth.security;

import com.retailerp.backend.config.JwtService;
import com.retailerp.backend.modules.auth.entity.User;
import com.retailerp.backend.modules.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            UUID userId = jwtService.extractUserId(token);
            String username = jwtService.extractUsername(token);

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<User> userOpt = userRepository.findById(userId);

                if (userOpt.isEmpty()) {
                    log.warn("JWT rejected: no user found in DB for userId={} (username claim={})", userId, username);
                } else if (!jwtService.isTokenValid(token, username)) {
                    log.warn("JWT rejected: isTokenValid() returned false for username={}", username);
                } else {
                    AuthenticatedUser authenticatedUser = new AuthenticatedUser(userOpt.get());

                    if (!authenticatedUser.isEnabled()) {
                        log.warn("JWT rejected: account is deactivated for username={}", username);
                    } else {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                authenticatedUser, null, authenticatedUser.getAuthorities());

                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("JWT rejected: exception while parsing/validating token on {} {}",
                    request.getMethod(), request.getRequestURI(), ex);
        }

        filterChain.doFilter(request, response);
    }
}