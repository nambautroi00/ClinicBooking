package com.example.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:noreply@clinic.com}")
    private String fromEmail;

    @GetMapping("/mail-config")
    public ResponseEntity<Map<String, Object>> checkMailConfig() {
        Map<String, Object> result = new HashMap<>();
        
        result.put("mailSenderExists", mailSender != null);
        result.put("fromEmail", fromEmail);
        result.put("mailSenderClass", mailSender != null ? mailSender.getClass().getName() : "null");
        
        return ResponseEntity.ok(result);
    }
}