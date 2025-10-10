package com.example.backend.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.AuthDTO;
import com.example.backend.service.AuthService;
import com.example.backend.service.EmailOtpService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth") 
@RequiredArgsConstructor
// Allow requests from the React dev server and allow credentials so cookies can be set
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final EmailOtpService emailOtpService;

    @PostMapping("/login")
    public ResponseEntity<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.LoginRequest loginRequest) {
        AuthDTO.LoginResponse response = authService.login(loginRequest);
        
        if (response.isSuccess()) {
            if (response.getUser() != null) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    // Build a simple map with basic fields to avoid serialization problems
                    Map<String, Object> userMap = new HashMap<>();
                    if (response.getUser().getId() != null) userMap.put("id", response.getUser().getId());
                    if (response.getUser().getEmail() != null) userMap.put("email", response.getUser().getEmail());
                    if (response.getUser().getFirstName() != null) userMap.put("firstName", response.getUser().getFirstName());
                    if (response.getUser().getLastName() != null) userMap.put("lastName", response.getUser().getLastName());
                    if (response.getUser().getPhone() != null) userMap.put("phone", response.getUser().getPhone());
                    if (response.getUser().getAddress() != null) userMap.put("address", response.getUser().getAddress());
                    if (response.getUser().getDateOfBirth() != null) userMap.put("dateOfBirth", response.getUser().getDateOfBirth().toString());
                    if (response.getUser().getGender() != null) userMap.put("gender", response.getUser().getGender().toString());
                    if (response.getUser().getRole() != null && response.getUser().getRole().getName() != null) userMap.put("role", response.getUser().getRole().getName());

                    String userJson = mapper.writeValueAsString(userMap);
                    String encoded = URLEncoder.encode(userJson, StandardCharsets.UTF_8);

                    ResponseCookie cookie = ResponseCookie.from("user", encoded)
                            .path("/")
                            .maxAge(7 * 24 * 60 * 60) // 7 days
                            .sameSite("Lax")
                            .httpOnly(false)
                            .secure(false)
                            .build();

                    return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(response);
                } catch (JsonProcessingException e) {
                    logger.error("Failed to serialize user for cookie", e);
                    // fallback to previous behavior: set userId cookie
                    Long userId = response.getUser().getId();
                    ResponseCookie cookie = ResponseCookie.from("userId", String.valueOf(userId))
                            .path("/")
                            .maxAge(7 * 24 * 60 * 60)
                            .sameSite("Lax")
                            .httpOnly(false)
                            .secure(false)
                            .build();

                    return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(response);
                }
            }
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthDTO.LogoutResponse> logout(@RequestBody(required = false) AuthDTO.LogoutRequest logoutRequest) {
        AuthDTO.LogoutResponse response = authService.logout(logoutRequest);
        // Clear the user and userId cookies on logout
        ResponseCookie cookieUser = ResponseCookie.from("user", "")
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .httpOnly(false)
                .secure(false)
                .build();

        ResponseCookie cookieUserId = ResponseCookie.from("userId", "")
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .httpOnly(false)
                .secure(false)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieUser.toString())
                .header(HttpHeaders.SET_COOKIE, cookieUserId.toString())
                .body(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDTO.RegisterResponse> register(@Valid @RequestBody AuthDTO.RegisterRequest registerRequest) {
        AuthDTO.RegisterResponse response = authService.register(registerRequest);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/google")
    public ResponseEntity<AuthDTO.LoginResponse> googleSignIn(@RequestBody Map<String, String> body) {
        try {
            // For now, accept both idToken and direct email/name (temporary solution)
            String email = body.get("email");
            String firstName = body.getOrDefault("firstName", "Google");
            String lastName = body.getOrDefault("lastName", "User");
            String idToken = body.get("idToken");
            
            // If email not provided but idToken exists, we need to decode it
            if ((email == null || email.trim().isEmpty()) && idToken != null) {
                // For now, create a dummy user since we don't have proper JWT decoding
                // TODO: Implement proper Google ID token verification
                email = "test-google-user@example.com";
                firstName = "Google";
                lastName = "User";
            }

            AuthDTO.LoginResponse response = authService.oauthLogin(email, firstName, lastName);
            if (response.isSuccess()) {
                if (response.getUser() != null) {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        Map<String, Object> userMap = new HashMap<>();
                        if (response.getUser().getId() != null) userMap.put("id", response.getUser().getId());
                        if (response.getUser().getEmail() != null) userMap.put("email", response.getUser().getEmail());
                        if (response.getUser().getFirstName() != null) userMap.put("firstName", response.getUser().getFirstName());
                        if (response.getUser().getLastName() != null) userMap.put("lastName", response.getUser().getLastName());
                        if (response.getUser().getPhone() != null) userMap.put("phone", response.getUser().getPhone());
                        if (response.getUser().getAddress() != null) userMap.put("address", response.getUser().getAddress());
                        if (response.getUser().getDateOfBirth() != null) userMap.put("dateOfBirth", response.getUser().getDateOfBirth().toString());
                        if (response.getUser().getGender() != null) userMap.put("gender", response.getUser().getGender().toString());
                        if (response.getUser().getRole() != null && response.getUser().getRole().getName() != null) userMap.put("role", response.getUser().getRole().getName());

                        String userJson = mapper.writeValueAsString(userMap);
                        String encoded = URLEncoder.encode(userJson, StandardCharsets.UTF_8);

                        ResponseCookie cookie = ResponseCookie.from("user", encoded)
                                .path("/")
                                .maxAge(7 * 24 * 60 * 60)
                                .sameSite("Lax")
                                .httpOnly(false)
                                .secure(false)
                                .build();

                        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(response);
                    } catch (JsonProcessingException e) {
                        logger.error("Failed to serialize user for cookie (google sign-in)", e);
                        Long userId = response.getUser().getId();
                        ResponseCookie cookie = ResponseCookie.from("userId", String.valueOf(userId))
                                .path("/")
                                .maxAge(7 * 24 * 60 * 60)
                                .sameSite("Lax")
                                .httpOnly(false)
                                .secure(false)
                                .build();

                        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(response);
                    }
                }
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.LoginResponse("OAuth error", false, null, null));
        }
    }

    // Email OTP Endpoints (no database storage)
    @PostMapping("/send-otp")
    public ResponseEntity<AuthDTO.OtpResponse> sendOtp(@Valid @RequestBody AuthDTO.SendOtpRequest request) {
        boolean success = emailOtpService.sendOtp(request.getEmail());
        
        AuthDTO.OtpResponse response = new AuthDTO.OtpResponse(
            success ? "Mã OTP đã được gửi đến email của bạn" : "Không thể gửi OTP, vui lòng thử lại",
            success
        );
        
        return success ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/verify-otp") 
    public ResponseEntity<AuthDTO.OtpResponse> verifyOtp(@Valid @RequestBody AuthDTO.VerifyOtpRequest request) {
        boolean success = emailOtpService.verifyOtp(request.getEmail(), request.getOtp());
        
        AuthDTO.OtpResponse response = new AuthDTO.OtpResponse(
            success ? "Mã OTP xác thực thành công" : "Mã OTP không hợp lệ hoặc đã hết hạn",
            success
        );
        
        return success ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/test-mail")
    public ResponseEntity<Map<String, Object>> testMailConfiguration() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Test gửi OTP đến email test
            boolean canSend = emailOtpService.sendOtp("test@example.com");
            result.put("mailConfigured", true);
            result.put("canSendOtp", canSend);
            result.put("message", canSend ? "Mail server hoạt động tốt" : "Không thể gửi email");
        } catch (Exception e) {
            result.put("mailConfigured", false);
            result.put("canSendOtp", false);
            result.put("message", "Lỗi cấu hình mail: " + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(result);
    }
}