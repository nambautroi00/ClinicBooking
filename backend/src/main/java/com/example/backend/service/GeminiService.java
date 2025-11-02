package com.example.backend.service;

import com.example.backend.dto.GeminiRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for integrating with Google Gemini API
 * Handles chatbot interactions for the Clinic Booking system
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${gemini.api.key:}")
    private String apiKey;
    
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String apiUrl;
    
    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;
    
    private static final Double DEFAULT_TEMPERATURE = 0.7;
    private static final Integer DEFAULT_MAX_TOKENS = 500;
    
    /**
     * Send a chat message to Google Gemini and get a response
     * 
     * @param userMessage The user's message
     * @return The AI's response
     */
    public String getChatResponse(String userMessage) {
        System.out.println("=== GEMINI SERVICE: getChatResponse called ===");
        System.out.println("User message: " + userMessage);
        log.info("Sending message to Gemini: {}", userMessage);
        
        if (apiKey == null || apiKey.isEmpty()) {
            log.error("Gemini API key is not configured");
            throw new IllegalStateException("Gemini API key is not configured. Please set GEMINI_API_KEY in application.yml");
        }
        
        try {
            // Build the request with system prompt for clinic booking context
            GeminiRequest request = buildRequest(userMessage);
            
            // Log request for debugging
            try {
                String requestJson = objectMapper.writeValueAsString(request);
                System.out.println("=== GEMINI API REQUEST ===");
                System.out.println("Request JSON: " + requestJson);
                log.info("=== Gemini API Request ===");
                log.info("Request JSON: {}", requestJson);
            } catch (Exception e) {
                System.err.println("Failed to serialize request: " + e.getMessage());
                log.warn("Failed to serialize request for logging: {}", e.getMessage());
            }
            
            // Build URL with API key
            String url = String.format("%s/%s:generateContent?key=%s", apiUrl, model, apiKey);
            log.info("Gemini API URL: {}", url.replace(apiKey, "***"));
            log.info("Model: {}", model);
            log.info("API Key configured: {}", apiKey != null && !apiKey.isEmpty() ? "Yes" : "No");
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create HTTP entity
            HttpEntity<GeminiRequest> entity = new HttpEntity<>(request, headers);
            
            // Make API call
            ResponseEntity<GeminiRequest.GeminiResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                GeminiRequest.GeminiResponse.class
            );
            
            // Extract and return the response
            GeminiRequest.GeminiResponse responseBody = response.getBody();
            if (responseBody != null && 
                responseBody.getCandidates() != null && 
                !responseBody.getCandidates().isEmpty()) {
                
                GeminiRequest.GeminiResponse.Candidate candidate = responseBody.getCandidates().get(0);
                if (candidate.getContent() != null && 
                    candidate.getContent().getParts() != null && 
                    !candidate.getContent().getParts().isEmpty()) {
                    
                    String aiResponse = candidate.getContent().getParts().get(0).getText();
                    log.info("Received response from Gemini: {}", aiResponse);
                    return aiResponse;
                }
            }
            
            log.warn("Empty response from Gemini API");
            return "Xin lỗi, tôi không thể tạo phản hồi lúc này. Vui lòng thử lại sau.";
            
        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            System.err.println("=== GEMINI API CLIENT ERROR ===");
            System.err.println("Status Code: " + e.getStatusCode());
            System.err.println("Error Body: " + errorBody);
            System.err.println("Headers: " + e.getResponseHeaders());
            log.error("HTTP Client Error calling Gemini API ({}): {}", e.getStatusCode(), errorBody);
            log.error("Error details - Status: {}, Body: {}, Headers: {}", 
                e.getStatusCode(), errorBody, e.getResponseHeaders());
            
            // Check for specific error messages
            if (errorBody != null) {
                String errorLower = errorBody.toLowerCase();
                if (errorLower.contains("api_key_invalid") || errorLower.contains("api key not valid") 
                    || errorLower.contains("invalid api key") || errorLower.contains("invalid_key")) {
                    log.error("API Key validation failed - check application.yml configuration");
                    return "Xin lỗi, API key không hợp lệ. Vui lòng liên hệ quản trị viên.";
                } else if (errorLower.contains("permission_denied") || errorLower.contains("permission denied")) {
                    return "Xin lỗi, không có quyền truy cập dịch vụ. Vui lòng liên hệ quản trị viên.";
                } else if (errorLower.contains("quota_exceeded") || errorLower.contains("quota exceeded")) {
                    return "Xin lỗi, đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.";
                } else if (errorLower.contains("invalid") || errorLower.contains("bad request")) {
                    log.error("Invalid request format - check request JSON structure");
                    return "Xin lỗi, định dạng yêu cầu không hợp lệ. Vui lòng thử lại sau.";
                }
            }
            return "Xin lỗi, có lỗi xảy ra khi gọi dịch vụ chatbot. Vui lòng thử lại sau.";
        } catch (HttpServerErrorException e) {
            log.error("HTTP Server Error calling Gemini API ({}): {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            return "Xin lỗi, dịch vụ chatbot hiện đang gặp sự cố. Vui lòng thử lại sau.";
        } catch (RestClientException e) {
            log.error("Network error calling Gemini API: {}", e.getMessage(), e);
            return "Xin lỗi, không thể kết nối đến dịch vụ chatbot. Vui lòng kiểm tra kết nối mạng và thử lại.";
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API: {}", e.getMessage(), e);
            return "Xin lỗi, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.";
        }
    }
    
    /**
     * Send a chat message with conversation history
     * 
     * @param contents List of previous messages in the conversation
     * @return The AI's response
     */
    public String getChatResponseWithHistory(List<GeminiRequest.Content> contents) {
        log.info("Sending conversation with {} messages to Gemini", contents.size());
        
        if (apiKey == null || apiKey.isEmpty()) {
            log.error("Gemini API key is not configured");
            throw new IllegalStateException("Gemini API key is not configured. Please set GEMINI_API_KEY in application.yml");
        }
        
        try {
            // Build the request with conversation history
            GeminiRequest request = GeminiRequest.builder()
                .contents(contents)
                .generationConfig(GeminiRequest.GenerationConfig.builder()
                    .temperature(DEFAULT_TEMPERATURE)
                    .maxOutputTokens(DEFAULT_MAX_TOKENS)
                    .build())
                .build();
            
            // Log request for debugging
            try {
                String requestJson = objectMapper.writeValueAsString(request);
                log.info("=== Gemini API Request (with history) ===");
                log.info("Request JSON: {}", requestJson);
            } catch (Exception e) {
                log.warn("Failed to serialize request for logging: {}", e.getMessage());
            }
            
            // Build URL with API key
            String url = String.format("%s/%s:generateContent?key=%s", apiUrl, model, apiKey);
            log.info("Gemini API URL: {}", url.replace(apiKey, "***"));
            log.info("Model: {}", model);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create HTTP entity
            HttpEntity<GeminiRequest> entity = new HttpEntity<>(request, headers);
            
            // Make API call
            ResponseEntity<GeminiRequest.GeminiResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                GeminiRequest.GeminiResponse.class
            );
            
            // Extract and return the response
            GeminiRequest.GeminiResponse responseBody = response.getBody();
            if (responseBody != null && 
                responseBody.getCandidates() != null && 
                !responseBody.getCandidates().isEmpty()) {
                
                GeminiRequest.GeminiResponse.Candidate candidate = responseBody.getCandidates().get(0);
                if (candidate.getContent() != null && 
                    candidate.getContent().getParts() != null && 
                    !candidate.getContent().getParts().isEmpty()) {
                    
                    String aiResponse = candidate.getContent().getParts().get(0).getText();
                    log.info("Received response from Gemini");
                    return aiResponse;
                }
            }
            
            log.warn("Empty response from Gemini API");
            return "Xin lỗi, tôi không thể tạo phản hồi lúc này. Vui lòng thử lại sau.";
            
        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            System.err.println("=== GEMINI API CLIENT ERROR ===");
            System.err.println("Status Code: " + e.getStatusCode());
            System.err.println("Error Body: " + errorBody);
            System.err.println("Headers: " + e.getResponseHeaders());
            log.error("HTTP Client Error calling Gemini API ({}): {}", e.getStatusCode(), errorBody);
            log.error("Error details - Status: {}, Body: {}, Headers: {}", 
                e.getStatusCode(), errorBody, e.getResponseHeaders());
            
            // Check for specific error messages
            if (errorBody != null) {
                String errorLower = errorBody.toLowerCase();
                if (errorLower.contains("api_key_invalid") || errorLower.contains("api key not valid") 
                    || errorLower.contains("invalid api key") || errorLower.contains("invalid_key")) {
                    log.error("API Key validation failed - check application.yml configuration");
                    return "Xin lỗi, API key không hợp lệ. Vui lòng liên hệ quản trị viên.";
                } else if (errorLower.contains("permission_denied") || errorLower.contains("permission denied")) {
                    return "Xin lỗi, không có quyền truy cập dịch vụ. Vui lòng liên hệ quản trị viên.";
                } else if (errorLower.contains("quota_exceeded") || errorLower.contains("quota exceeded")) {
                    return "Xin lỗi, đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.";
                } else if (errorLower.contains("invalid") || errorLower.contains("bad request")) {
                    log.error("Invalid request format - check request JSON structure");
                    return "Xin lỗi, định dạng yêu cầu không hợp lệ. Vui lòng thử lại sau.";
                }
            }
            return "Xin lỗi, có lỗi xảy ra khi gọi dịch vụ chatbot. Vui lòng thử lại sau.";
        } catch (HttpServerErrorException e) {
            log.error("HTTP Server Error calling Gemini API ({}): {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            return "Xin lỗi, dịch vụ chatbot hiện đang gặp sự cố. Vui lòng thử lại sau.";
        } catch (RestClientException e) {
            log.error("Network error calling Gemini API: {}", e.getMessage(), e);
            return "Xin lỗi, không thể kết nối đến dịch vụ chatbot. Vui lòng kiểm tra kết nối mạng và thử lại.";
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API: {}", e.getMessage(), e);
            return "Xin lỗi, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.";
        }
    }
    
    /**
     * Build a Gemini request with clinic booking system context
     */
    private GeminiRequest buildRequest(String userMessage) {
        List<GeminiRequest.Content> contents = new ArrayList<>();
        
        // System prompt embedded in the first user message
        String contextualMessage = "You are a helpful AI assistant for a Clinic Booking web application. " +
                "You help users with information about booking appointments, doctor schedules, " +
                "medical services, and general clinic information. Be professional, friendly, " +
                "and concise in your responses. If you don't know specific information about " +
                "the clinic, politely inform the user to contact the clinic directly.\n\n" +
                "User question: " + userMessage;
        
        // Create user content with system context
        GeminiRequest.Content userContent = GeminiRequest.Content.builder()
            .role("user")
            .parts(List.of(GeminiRequest.Part.builder()
                .text(contextualMessage)
                .build()))
            .build();
        
        contents.add(userContent);
        
        return GeminiRequest.builder()
            .contents(contents)
            .generationConfig(GeminiRequest.GenerationConfig.builder()
                .temperature(DEFAULT_TEMPERATURE)
                .maxOutputTokens(DEFAULT_MAX_TOKENS)
                .build())
            .build();
    }
}
