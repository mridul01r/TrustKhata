package com.retailerp.backend.modules.license;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class LicenseCheckFilter extends OncePerRequestFilter {

    private final LicenseService licenseService;

    public LicenseCheckFilter(LicenseService licenseService) {
        this.licenseService = licenseService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        boolean exempt = path.startsWith("/api/license") || path.startsWith("/actuator/health");

        if (exempt || !path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!licenseService.isLicensed()) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"License required\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}