package com.example.backend.controller;

import java.util.HashMap;
import java.util.Map;

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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth") 
@RequiredArgsConstructor
// Allow requests from the React dev server and allow credentials so cookies can be set
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {

    private final AuthService authService;
    private final EmailOtpService emailOtpService;

    @PostMapping("/login")
    public ResponseEntity<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.LoginRequest loginRequest) {
        AuthDTO.LoginResponse response = authService.login(loginRequest);
        
        if (response.isSuccess()) {
            Long userId = response.getUser() != null ? response.getUser().getId() : null;
            if (userId != null) {
                ResponseCookie cookie = ResponseCookie.from("userId", String.valueOf(userId))
                        .path("/")
                        .maxAge(7 * 24 * 60 * 60) // 7 days
                        .sameSite("Lax")
                        .httpOnly(false)
                        .secure(false)
                        .build();

                return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(response);
            }
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthDTO.LogoutResponse> logout(@RequestBody(required = false) AuthDTO.LogoutRequest logoutRequest) {
        AuthDTO.LogoutResponse response = authService.logout(logoutRequest);
        // Clear the userId cookie on logout
        ResponseCookie cookie = ResponseCookie.from("userId", "")
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .httpOnly(false)
                .secure(false)
                .build();

        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(response);
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
            String email = body.get("email");
            String firstName = body.getOrDefault("firstName", "");
            String lastName = body.getOrDefault("lastName", "");

            AuthDTO.LoginResponse response = authService.oauthLogin(email, firstName, lastName);
            if (response.isSuccess()) {
                Long userId = response.getUser() != null ? response.getUser().getId() : null;
                if (userId != null) {
                    ResponseCookie cookie = ResponseCookie.from("userId", String.valueOf(userId))
                            .path("/")
                            .maxAge(7 * 24 * 60 * 60)
                            .sameSite("Lax")
                            .httpOnly(false)
                            .secure(false)
                            .build();

                    return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(response);
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