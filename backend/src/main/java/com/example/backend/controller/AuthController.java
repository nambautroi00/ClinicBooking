package com.example.backend.controller;

import java.util.HashMap;
import java.util.Map;

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
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final EmailOtpService emailOtpService;

    @PostMapping("/login")
    public ResponseEntity<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.LoginRequest loginRequest) {
        AuthDTO.LoginResponse response = authService.login(loginRequest);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthDTO.LogoutResponse> logout(@RequestBody(required = false) AuthDTO.LogoutRequest logoutRequest) {
        AuthDTO.LogoutResponse response = authService.logout(logoutRequest);
        return ResponseEntity.ok(response);
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