package com.example.backend.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable()) // Disable CORS temporarily for testing
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**").permitAll()  // Cho phép tất cả auth endpoints
                .requestMatchers("/api/users/**").permitAll() // Cho phép user endpoints (temporary)
                .requestMatchers("/api/roles/**").permitAll() // Cho phép role endpoints (temporary)
                .requestMatchers("/api/departments/**").permitAll() // Cho phép department endpoints (temporary)
                .requestMatchers("/api/patients/**").permitAll() // Cho phép patient endpoints (temporary)
                .requestMatchers("/api/doctors/**").permitAll() // Cho phép doctor endpoints (temporary)
                .requestMatchers("/test-mail").permitAll() // Test endpoint
                .anyRequest().permitAll() // Temporarily allow all requests for debugging
            );
        return http.build();
    }

    @Bean
    public SimplePasswordEncoder passwordEncoder() {
        return new SimplePasswordEncoder();
    }

    public static class SimplePasswordEncoder {
        
        public String encode(String rawPassword) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hash) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) {
                        hexString.append('0');
                    }
                    hexString.append(hex);
                }
                return hexString.toString();
            } catch (Exception e) {
                throw new RuntimeException("Error encoding password", e);
            }
        }

        public boolean matches(String rawPassword, String encodedPassword) {
            return encode(rawPassword).equals(encodedPassword);
        }
    }
}