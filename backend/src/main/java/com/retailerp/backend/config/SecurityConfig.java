package com.retailerp.backend.config;

import com.retailerp.backend.modules.auth.security.JwtAuthenticationFilter;
import com.retailerp.backend.modules.license.LicenseCheckFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final LicenseCheckFilter licenseCheckFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, LicenseCheckFilter licenseCheckFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.licenseCheckFilter = licenseCheckFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":401,\"message\":\"Your session has expired. Please log in again.\"}");
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":403,\"message\":\"You don't have permission to access this.\"}");
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/assets/**",
                                "/*.svg",
                                "/*.ico",
                                "/*.png",
                                "/*.woff2")
                        .permitAll()
                        // All /api/** rules MUST be evaluated before the SPA catch-all below,
                        // since that catch-all's regex also matches API paths with no dot in them.
                        .requestMatchers("/api/auth/login/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/api/license/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/inventory/products").hasAnyRole("OWNER", "CASHIER")
                        .requestMatchers("/api/inventory/**").hasRole("OWNER")
                        .requestMatchers("/api/suppliers/**").hasRole("OWNER")
                        .requestMatchers("/api/purchases/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.GET, "/api/customers").hasAnyRole("OWNER", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/customers").hasRole("OWNER")
                        .requestMatchers("/api/customers/**").hasRole("OWNER")
                        .requestMatchers("/api/accounting/**").hasRole("OWNER")
                        .requestMatchers("/api/reports/**").hasRole("OWNER")
                        .requestMatchers("/api/settings/**").hasRole("OWNER")
                        .requestMatchers("/api/staff/**").hasRole("OWNER")
                        .requestMatchers("/api/**").authenticated()
                        // SPA client-side routing catch-all — now only reachable for non-/api paths,
                        // since every /api/** path is already matched by a rule above.
                        .requestMatchers("/{path:[^\\.]*}", "/**/{path:[^\\.]*}").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(licenseCheckFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}