package com.example.backend.service;

import com.example.backend.dto.GeminiRequest;
import com.example.backend.model.Department;
import com.example.backend.repository.DepartmentRepository;
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
    private final DepartmentRepository departmentRepository;
    
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
            return generateFallbackResponse(userMessage);
            
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
                    return generateFallbackResponse(userMessage);
                } else if (errorLower.contains("permission_denied") || errorLower.contains("permission denied")) {
                    return generateFallbackResponse(userMessage);
                } else if (errorLower.contains("quota_exceeded") || errorLower.contains("quota exceeded")) {
                    return generateFallbackResponse(userMessage);
                } else if (errorLower.contains("invalid") || errorLower.contains("bad request")) {
                    log.error("Invalid request format - check request JSON structure");
                    return generateFallbackResponse(userMessage);
                }
            }
            return generateFallbackResponse(userMessage);
        } catch (HttpServerErrorException e) {
            log.error("HTTP Server Error calling Gemini API ({}): {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            return generateFallbackResponse(userMessage);
        } catch (RestClientException e) {
            log.error("Network error calling Gemini API: {}", e.getMessage(), e);
            return generateFallbackResponse(userMessage);
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API: {}", e.getMessage(), e);
            return generateFallbackResponse(userMessage);
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
        
        // Extract user message from contents for fallback
        String userMessage = "";
        try {
            if (contents != null && !contents.isEmpty()) {
                // Get the last user message
                for (int i = contents.size() - 1; i >= 0; i--) {
                    GeminiRequest.Content content = contents.get(i);
                    if (content != null && "user".equals(content.getRole()) && 
                        content.getParts() != null && !content.getParts().isEmpty()) {
                        GeminiRequest.Part part = content.getParts().get(0);
                        if (part != null && part.getText() != null) {
                            userMessage = part.getText();
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract user message from contents: {}", e.getMessage());
        }
        
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
            return generateFallbackResponse(userMessage);
            
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
                    return generateFallbackResponse(userMessage);
                } else if (errorLower.contains("permission_denied") || errorLower.contains("permission denied")) {
                    return generateFallbackResponse(userMessage);
                } else if (errorLower.contains("quota_exceeded") || errorLower.contains("quota exceeded")) {
                    return generateFallbackResponse(userMessage);
                } else if (errorLower.contains("invalid") || errorLower.contains("bad request")) {
                    log.error("Invalid request format - check request JSON structure");
                    return generateFallbackResponse(userMessage);
                }
            }
            return generateFallbackResponse(userMessage);
        } catch (HttpServerErrorException e) {
            log.error("HTTP Server Error calling Gemini API ({}): {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            return generateFallbackResponse(userMessage);
        } catch (RestClientException e) {
            log.error("Network error calling Gemini API: {}", e.getMessage(), e);
            return generateFallbackResponse(userMessage);
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API: {}", e.getMessage(), e);
            return generateFallbackResponse(userMessage);
        }
    }
    
    /**
     * Build a Gemini request with clinic booking system context
     */
    private GeminiRequest buildRequest(String userMessage) {
        List<GeminiRequest.Content> contents = new ArrayList<>();
        
        // Get list of departments from database with error handling
        String departmentsInfo = "";
        try {
            List<Department> departments = departmentRepository.findAll();
            departmentsInfo = buildDepartmentsInfo(departments);
        } catch (Exception e) {
            log.warn("Failed to load departments from database: {}", e.getMessage());
            departmentsInfo = "Unable to load department information at this time.";
        }
        
        // System prompt embedded in the first user message with full functionality
        String contextualMessage = buildSystemPrompt(departmentsInfo);
        
        contextualMessage += "\nUser question: " + userMessage;
        
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
                .maxOutputTokens(1000) // Increased to handle doctor lists
                .build())
            .build();
    }
    
    /**
     * Build department information string for the AI prompt
     */
    private String buildDepartmentsInfo(List<Department> departments) {
        StringBuilder info = new StringBuilder();
        info.append("Các khoa khám bệnh:\n");
        
        for (Department dept : departments) {
            if (dept.getStatus() == Department.DepartmentStatus.ACTIVE) {
                info.append("- ").append(dept.getDepartmentName());
                // Only include description if it exists and is not too long
                if (dept.getDescription() != null && !dept.getDescription().isEmpty()) {
                    String desc = dept.getDescription();
                    // Limit description to first 50 characters
                    if (desc.length() > 50) {
                        desc = desc.substring(0, 47) + "...";
                    }
                    info.append(": ").append(desc);
                }
                info.append("\n");
            }
        }
        
        return info.toString();
    }
    
    /**
     * Build comprehensive system prompt with all chatbot capabilities
     */
    private String buildSystemPrompt(String departmentsInfo) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are a helpful AI assistant for a Clinic Booking web application. ");
        prompt.append("Your role is to assist users with clinic information, appointments, and guidance.\n\n");
        
        prompt.append("=== YOUR CAPABILITIES ===\n\n");
        
        prompt.append("A. BOOKING GUIDANCE & SUPPORT\n");
        prompt.append("When users ask about booking appointments:\n");
        prompt.append("- Guide them through the booking process step by step\n");
        prompt.append("- Explain how to select a doctor and time slot\n");
        prompt.append("- Clarify if they can book for family members\n");
        prompt.append("- Mention that they need to login first\n");
        prompt.append("- Suggest checking available slots through the booking system\n\n");
        
        prompt.append("B. BASIC CLINIC INFORMATION\n");
        prompt.append("Provide information about:\n");
        prompt.append("- Operating hours: Monday-Saturday 7:00 AM - 8:00 PM, Sunday 8:00 AM - 5:00 PM\n");
        prompt.append("- Health insurance: We accept health insurance cards\n");
        prompt.append("- Location: Check our website for clinic address\n");
        prompt.append("- Services: All medical specialties are available\n");
        prompt.append("- For specific doctor information: Check doctor profiles on our website\n\n");
        
        prompt.append("C. MEDICAL DEPARTMENT RECOMMENDATIONS\n");
        prompt.append("When users describe symptoms or ask which department to visit:\n");
        prompt.append("Analyze their symptoms and recommend the appropriate department(s) from this list:\n\n");
        prompt.append(departmentsInfo);
        prompt.append("\n⚠️ IMPORTANT: Always include this disclaimer:\n");
        prompt.append("\"Thông tin chỉ mang tính tham khảo, anh/chị nên gặp bác sĩ để được chẩn đoán chính xác.\"\n\n");
        
        prompt.append("D. APPOINTMENT MANAGEMENT\n");
        prompt.append("When users ask to check, cancel, or reschedule appointments:\n");
        prompt.append("- Guide them to login to their account\n");
        prompt.append("- Explain how to view appointments in their profile\n");
        prompt.append("- For canceling: Mention they can do it from their appointment list\n");
        prompt.append("- For rescheduling: Suggest canceling current appointment and booking a new one\n");
        prompt.append("- Remind them to check appointment details carefully\n\n");
        
        prompt.append("=== RESPONSE GUIDELINES ===\n");
        prompt.append("- Be friendly, professional, and helpful\n");
        prompt.append("- Respond in Vietnamese\n");
        prompt.append("- Keep responses concise but informative\n");
        prompt.append("- Use **bold** for important information like department names\n");
        prompt.append("- If you don't know specific information, politely direct them to contact the clinic\n");
        prompt.append("- Never provide medical diagnoses - only guidance on which department to visit\n");
        prompt.append("- Always prioritize patient safety and professional medical consultation\n\n");
        
        return prompt.toString();
    }
    
    /**
     * Generate a fallback response when AI service is unavailable
     * Provides basic department recommendations based on common symptoms
     */
    private String generateFallbackResponse(String userMessage) {
        String messageLower = userMessage.toLowerCase();
        
        // A. Booking guidance & support
        if (messageLower.contains("đặt lịch") || messageLower.contains("book") || 
            messageLower.contains("appointment") || messageLower.contains("khám bác sĩ") ||
            messageLower.contains("cách đặt") || messageLower.contains("làm sao đặt")) {
            return "Để đặt lịch khám:\n" +
                   "• Đăng nhập vào tài khoản của bạn\n" +
                   "• Chọn chuyên khoa và bác sĩ phù hợp\n" +
                   "• Chọn thời gian khám còn trống\n" +
                   "• Xác nhận thông tin và hoàn tất đặt lịch\n\n" +
                   "Bạn có thể đặt lịch cho người thân khi đã đăng nhập. " +
                   "Hãy kiểm tra các khung giờ còn trống trên hệ thống của chúng tôi.";
        }
        
        // B. Basic clinic information
        if (messageLower.contains("mở cửa") || messageLower.contains("giờ làm việc") || 
            messageLower.contains("hoạt động")) {
            return "Phòng khám hoạt động:\n" +
                   "• Thứ 2 - Thứ 6: 7:00 - 20:00\n" +
                   "• Thứ 7: 7:00 - 20:00\n" +
                   "• Chủ nhật: 8:00 - 17:00\n\n" +
                   "Quý khách vui lòng liên hệ hotline để biết thêm chi tiết.";
        }
        
        if (messageLower.contains("bảo hiểm") || messageLower.contains("bảo hiểm y tế")) {
            return "Phòng khám chúng tôi chấp nhận bảo hiểm y tế. " +
                   "Vui lòng mang theo thẻ BHYT khi đến khám để được hưởng các chế độ theo quy định.";
        }
        
        if (messageLower.contains("địa chỉ") || messageLower.contains("ở đâu") || 
            messageLower.contains("đường nào")) {
            return "Thông tin địa chỉ phòng khám vui lòng kiểm tra trên website chính thức của chúng tôi. " +
                   "Hoặc bạn có thể liên hệ hotline để được hướng dẫn chi tiết.";
        }
        
        // D. Appointment management
        if (messageLower.contains("kiểm tra lịch") || messageLower.contains("lịch hẹn") ||
            messageLower.contains("xem lịch") || messageLower.contains("appointment")) {
            return "Để kiểm tra lịch hẹn của bạn:\n" +
                   "• Đăng nhập vào tài khoản\n" +
                   "• Vào phần \"Lịch hẹn của tôi\"\n" +
                   "• Xem chi tiết các cuộc hẹn đã đặt\n\n" +
                   "Tại đây bạn có thể xem, hủy hoặc thay đổi lịch hẹn.";
        }
        
        if (messageLower.contains("hủy lịch") || messageLower.contains("hủy hẹn") ||
            messageLower.contains("cancel")) {
            return "Để hủy lịch hẹn:\n" +
                   "• Đăng nhập vào tài khoản\n" +
                   "• Vào \"Lịch hẹn của tôi\"\n" +
                   "• Chọn lịch hẹn muốn hủy\n" +
                   "• Nhấn nút \"Hủy lịch\"\n\n" +
                   "Vui lòng hủy trước ít nhất 2 giờ để tránh phí hủy không hoàn lại.";
        }
        
        if (messageLower.contains("đổi lịch") || messageLower.contains("thay đổi") ||
            messageLower.contains("reschedule") || messageLower.contains("hoãn")) {
            return "Để thay đổi lịch hẹn:\n" +
                   "• Hủy lịch hẹn hiện tại (theo hướng dẫn ở trên)\n" +
                   "• Đặt lịch hẹn mới với thời gian mong muốn\n\n" +
                   "Vui lòng kiểm tra các khung giờ còn trống trước khi đặt lịch mới.";
        }
        
        // Handle single numbers or unclear messages
        if (messageLower.matches("^\\d+$") || messageLower.trim().length() < 3) {
            return "Xin chào! Tôi có thể giúp bạn:\n\n" +
                   "📅 **Đặt lịch khám** - Hướng dẫn đặt lịch với bác sĩ\n" +
                   "🏥 **Tư vấn khoa khám** - Giúp chọn khoa phù hợp với triệu chứng\n" +
                   "⏰ **Giờ làm việc** - Thông tin thời gian hoạt động\n" +
                   "💳 **Bảo hiểm y tế** - Chính sách BHYT\n" +
                   "📍 **Địa chỉ** - Thông tin liên hệ\n" +
                   "📋 **Quản lý lịch** - Kiểm tra, hủy, đổi lịch hẹn\n\n" +
                   "Vui lòng mô tả rõ bạn cần hỗ trợ gì?";
        }
        
        // C. Medical department recommendations (existing symptom mapping)
        // Map symptoms to departments
        String disclaimer = "\n\n⚠️ Thông tin chỉ mang tính tham khảo, anh/chị nên gặp bác sĩ để được chẩn đoán chính xác.";
        
        if (messageLower.contains("đau bụng") || messageLower.contains("dạ dày") || 
            messageLower.contains("tiêu hóa") || messageLower.contains("gan") || 
            messageLower.contains("mật") || messageLower.contains("ruột")) {
            return "Với triệu chứng đau bụng và các vấn đề về tiêu hóa, bạn nên khám tại **Khoa Tiêu hóa**. " +
                   "Khoa này chuyên điều trị các bệnh về dạ dày, gan, mật và ruột." + disclaimer;
        } else if (messageLower.contains("đau đầu") || messageLower.contains("thần kinh") || 
                   messageLower.contains("mất ngủ") || messageLower.contains("động kinh")) {
            return "Với triệu chứng đau đầu, bạn nên khám tại **Khoa Thần kinh**. " +
                   "Khoa này chuyên điều trị các bệnh về thần kinh trung ương và ngoại biên." + disclaimer;
        } else if (messageLower.contains("tim") || messageLower.contains("mạch") || 
                   messageLower.contains("huyết áp") || messageLower.contains("ngực")) {
            return "Với các vấn đề về tim mạch, bạn nên khám tại **Khoa Tim mạch**. " +
                   "Khoa này chuyên điều trị các bệnh về tim và mạch máu." + disclaimer;
        } else if (messageLower.contains("ho") || messageLower.contains("hô hấp") || 
                   messageLower.contains("phổi") || messageLower.contains("khó thở")) {
            return "Với các vấn đề về hô hấp, bạn nên khám tại **Khoa Hô hấp**. " +
                   "Khoa này chuyên điều trị các bệnh lý phổi và đường hô hấp." + disclaimer;
        } else if (messageLower.contains("mắt") || messageLower.contains("nhìn")) {
            return "Với các vấn đề về mắt, bạn nên khám tại **Khoa Mắt**. " +
                   "Khoa này khám và điều trị các bệnh lý về mắt." + disclaimer;
        } else if (messageLower.contains("da") || messageLower.contains("mụn") || 
                   messageLower.contains("ngứa") || messageLower.contains("eczema")) {
            return "Với các vấn đề về da, bạn nên khám tại **Khoa Da liễu**. " +
                   "Khoa này điều trị các bệnh về da, tóc và móng." + disclaimer;
        } else if (messageLower.contains("răng") || messageLower.contains("miệng")) {
            return "Với các vấn đề về răng miệng, bạn nên khám tại **Khoa Răng - Hàm - Mặt**. " +
                   "Khoa này khám và điều trị các vấn đề về răng miệng." + disclaimer;
        } else if (messageLower.contains("tai") || messageLower.contains("mũi") || 
                   messageLower.contains("họng")) {
            return "Với các vấn đề về tai mũi họng, bạn nên khám tại **Khoa Tai - Mũi - Họng**. " +
                   "Khoa này khám và điều trị các bệnh đường hô hấp trên." + disclaimer;
        } else if (messageLower.contains("xương") || messageLower.contains("khớp") || 
                   messageLower.contains("gãy") || messageLower.contains("trật")) {
            return "Với các vấn đề về xương khớp, bạn nên khám tại **Khoa Chấn thương chỉnh hình** hoặc **Khoa Cơ - Xương - Khớp**. " +
                   "Các khoa này chuyên điều trị gãy xương, trật khớp và các bệnh về xương khớp." + disclaimer;
        } else if (messageLower.contains("trẻ em") || messageLower.contains("nhi khoa")) {
            return "Với bệnh nhân trẻ em, bạn nên khám tại **Khoa Nhi**. " +
                   "Khoa này chuyên khám và điều trị cho trẻ em." + disclaimer;
        }
        
        // Default fallback message
        return "Cảm ơn bạn đã liên hệ. Hiện tại dịch vụ chatbot AI đang gặp sự cố. " +
               "Vui lòng liên hệ trực tiếp với phòng khám qua hotline hoặc website để được tư vấn về các khoa khám bệnh phù hợp.";
    }
}
