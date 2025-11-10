package com.example.backend.service;

import com.example.backend.dto.ChatbotResponseDto;
import com.example.backend.dto.GeminiRequest;
import com.example.backend.model.Department;
import com.example.backend.model.Doctor;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.repository.DoctorRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

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
    private final DoctorRepository doctorRepository;
    
    @Value("${gemini.api.key:}")
    private String apiKey;
    
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String apiUrl;
    
    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;
    
    private static final Double DEFAULT_TEMPERATURE = 0.7;
    private static final Integer DEFAULT_MAX_TOKENS = 1024;
    
    /**
     * Send a chat message to Google Gemini and get a structured response
     *
     * @param userMessage The user's message
     * @return Structured response containing advice, department and doctors
     */
    public ChatbotResponseDto getChatResponse(String userMessage) {
        log.info("Sending message to Gemini (model={}): {}", model, userMessage);

        if (apiKey == null || apiKey.isEmpty()) {
            log.error("Gemini API key is not configured");
            throw new IllegalStateException("Gemini API key is not configured. Please set GEMINI_API_KEY in application.yml");
        }

        List<Department> departments = loadDepartmentsForPrompt();

        try {
            ObjectNode payload = buildChatPayload(userMessage, departments);
            String rawApiResponse = callGeminiApi(payload);
            String aiResponse = extractPrimaryText(rawApiResponse);

            if (aiResponse != null && !aiResponse.isBlank()) {
                log.info("Received response from Gemini");
                return buildStructuredResponse(aiResponse, userMessage, departments);
            }

            log.warn("Empty response from Gemini API");
            return buildFallbackDto(userMessage);

        } catch (HttpClientErrorException e) {
            handleClientError(e);
            return buildFallbackDto(userMessage);
        } catch (HttpServerErrorException e) {
            log.error("HTTP Server Error calling Gemini API ({}): {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            return buildFallbackDto(userMessage);
        } catch (RestClientException e) {
            log.error("Network error calling Gemini API: {}", e.getMessage(), e);
            return buildFallbackDto(userMessage);
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API: {}", e.getMessage(), e);
            return buildFallbackDto(userMessage);
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

        String userMessage = extractLastUserMessage(contents);

        if (apiKey == null || apiKey.isEmpty()) {
            log.error("Gemini API key is not configured");
            throw new IllegalStateException("Gemini API key is not configured. Please set GEMINI_API_KEY in application.yml");
        }

        List<Department> departments = loadDepartmentsForPrompt();

        try {
            ObjectNode payload = buildHistoryPayload(contents, departments);
            String rawApiResponse = callGeminiApi(payload);
            String aiResponse = extractPrimaryText(rawApiResponse);

            if (aiResponse != null && !aiResponse.isBlank()) {
                log.info("Received response from Gemini");
                return aiResponse;
            }

            log.warn("Empty response from Gemini API");
            return generateFallbackResponse(userMessage);

        } catch (HttpClientErrorException e) {
            handleClientError(e);
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

    private List<Department> loadDepartmentsForPrompt() {
        try {
            return departmentRepository.findAll();
        } catch (Exception e) {
            log.warn("Failed to load departments for chatbot context: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private ObjectNode buildChatPayload(String userMessage, List<Department> departments) {
        String departmentsInfo = buildDepartmentsInfo(departments);
        if (departmentsInfo.isBlank()) {
            departmentsInfo = "Danh sach khoa tam thoi khong kha dung.";
        }
        String systemPrompt = buildSystemPrompt(departmentsInfo);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("system_instruction", buildSystemInstructionNode(systemPrompt));
        payload.set("contents", buildSingleTurnContent(userMessage));
        payload.set("generationConfig", buildGenerationConfig());
        return payload;
    }

    private ObjectNode buildHistoryPayload(List<GeminiRequest.Content> history, List<Department> departments) {
        String departmentsInfo = buildDepartmentsInfo(departments);
        if (departmentsInfo.isBlank()) {
            departmentsInfo = "Danh sach khoa tam thoi khong kha dung.";
        }
        String systemPrompt = buildSystemPrompt(departmentsInfo);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("system_instruction", buildSystemInstructionNode(systemPrompt));
        payload.set("contents", convertHistoryToContents(history));
        payload.set("generationConfig", buildGenerationConfig());
        return payload;
    }

    private ArrayNode buildSingleTurnContent(String userMessage) {
        ArrayNode contents = objectMapper.createArrayNode();
        ObjectNode user = objectMapper.createObjectNode();
        user.put("role", "user");
        user.set("parts", buildTextParts(userMessage));
        contents.add(user);
        return contents;
    }

    private ArrayNode convertHistoryToContents(List<GeminiRequest.Content> history) {
        ArrayNode contentsNode = objectMapper.createArrayNode();
        if (history == null || history.isEmpty()) {
            return contentsNode;
        }

        for (GeminiRequest.Content content : history) {
            if (content == null || content.getParts() == null) {
                continue;
            }
            ObjectNode contentNode = objectMapper.createObjectNode();
            contentNode.put("role", content.getRole() == null ? "user" : content.getRole());

            ArrayNode partsNode = objectMapper.createArrayNode();
            for (GeminiRequest.Part part : content.getParts()) {
                if (part != null && part.getText() != null) {
                    ObjectNode textNode = objectMapper.createObjectNode();
                    textNode.put("text", part.getText());
                    partsNode.add(textNode);
                }
            }

            if (partsNode.size() > 0) {
                contentNode.set("parts", partsNode);
                contentsNode.add(contentNode);
            }
        }
        return contentsNode;
    }

    private ObjectNode buildSystemInstructionNode(String prompt) {
        ObjectNode instruction = objectMapper.createObjectNode();
        instruction.set("parts", buildTextParts(prompt));
        return instruction;
    }

    private ArrayNode buildTextParts(String text) {
        ArrayNode parts = objectMapper.createArrayNode();
        ObjectNode node = objectMapper.createObjectNode();
        node.put("text", text);
        parts.add(node);
        return parts;
    }

    private ObjectNode buildGenerationConfig() {
        ObjectNode genConfig = objectMapper.createObjectNode();
        genConfig.put("temperature", DEFAULT_TEMPERATURE);
        genConfig.put("maxOutputTokens", DEFAULT_MAX_TOKENS);
        return genConfig;
    }

    private String callGeminiApi(ObjectNode payload) throws JsonProcessingException {
        String url = String.format("%s/%s:generateContent?key=%s", apiUrl, model, apiKey);
        String requestJson = objectMapper.writeValueAsString(payload);
        log.debug("=== Gemini API Payload === {}", requestJson);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(requestJson, headers);

        ResponseEntity<String> response = restTemplate.exchange(
            url,
            HttpMethod.POST,
            entity,
            String.class
        );

        return response.getBody();
    }

    private String extractPrimaryText(String responseJson) {
        if (responseJson == null || responseJson.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray()) {
                for (JsonNode candidate : candidates) {
                    JsonNode content = candidate.path("content");
                    JsonNode parts = content.path("parts");
                    if (parts.isArray()) {
                        for (JsonNode part : parts) {
                            JsonNode textNode = part.path("text");
                            if (!textNode.isMissingNode()) {
                                return textNode.asText();
                            }
                        }
                    }
                }
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse Gemini response JSON: {}", e.getMessage());
        }
        return null;
    }

    private void handleClientError(HttpClientErrorException e) {
        String errorBody = e.getResponseBodyAsString();
        log.error("HTTP Client Error calling Gemini API ({}): {}", e.getStatusCode(), errorBody);

        if (errorBody == null) {
            return;
        }

        String errorLower = errorBody.toLowerCase();
        if (errorLower.contains("api_key_invalid") || errorLower.contains("api key not valid")
            || errorLower.contains("invalid api key") || errorLower.contains("invalid_key")) {
            log.error("API Key validation failed - check application.yml configuration");
        } else if (errorLower.contains("invalid") || errorLower.contains("bad request")) {
            log.error("Invalid request format - check request JSON structure");
        } else if (errorLower.contains("permission_denied")) {
            log.error("Gemini permission denied - ensure model access is enabled");
        } else if (errorLower.contains("quota") || errorLower.contains("exceeded")) {
            log.error("Gemini quota exceeded - please review usage limits");
        }
    }

    private String extractLastUserMessage(List<GeminiRequest.Content> contents) {
        String userMessage = "";
        try {
            if (contents != null && !contents.isEmpty()) {
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
            log.warn("Failed to extract user message from conversation history: {}", e.getMessage());
        }
        return userMessage;
    }

    /**
     * Build department information string for the AI prompt
     */
    private String buildDepartmentsInfo(List<Department> departments) {
        StringBuilder info = new StringBuilder();
        info.append("Danh sach khoa dang hoat dong, luu y su dung dung ten tu danh sach nay:\n");

        if (departments == null || departments.isEmpty()) {
            info.append("- Thong tin khoa tam thoi khong kha dung.\n");
            return info.toString();
        }

        for (Department dept : departments) {
            if (dept != null && dept.getStatus() == Department.DepartmentStatus.ACTIVE) {
                info.append("- [ID: ").append(dept.getId()).append("] ").append(dept.getDepartmentName());
                if (dept.getDescription() != null && !dept.getDescription().isEmpty()) {
                    String desc = dept.getDescription();
                    if (desc.length() > 60) {
                        desc = desc.substring(0, 57) + "...";
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

        prompt.append("You are a Vietnamese medical triage assistant for the Clinic Booking application. ");
        prompt.append("Always be empathetic, concise, and safety-focused. ");
        prompt.append("Use the provided department list to guide patients to the most relevant department.\n\n");

        prompt.append("=== TRIAGE RULES ===\n");
        prompt.append("1. When symptoms are clear, suggest the most likely condition (informal, not a diagnosis) and the department that should examine it.\n");
        prompt.append("2. If the information is insufficient, ask ONE targeted follow-up question and set status to NEED_MORE_INFO. Once you have enough data, set status to COMPLETE.\n");
        prompt.append("3. Always include the safety disclaimer: \"Thông tin chỉ mang tính tham khảo, anh/chị nên gặp bác sĩ để được chẩn đoán chính xác.\"\n");
        prompt.append("4. Never invent department names. Pick EXACTLY from this directory:\n\n");
        prompt.append(departmentsInfo).append("\n");

        prompt.append("=== BOOKING & GENERAL SUPPORT ===\n");
        prompt.append("- Hướng dẫn người dùng đăng nhập, chọn bác sĩ/khoa, chọn giờ khám và xác nhận lịch.\n");
        prompt.append("- Giải thích cách xem, hủy hoặc đặt lại lịch khám trong hồ sơ cá nhân.\n");
        prompt.append("- Cung cấp thông tin hoạt động: Thứ 2-7 (7:00-20:00), Chủ nhật (8:00-17:00), nhận thẻ BHYT.\n\n");

        prompt.append("=== RESPONSE FORMAT (STRICT JSON) ===\n");
        prompt.append("Always answer ONLY in compact JSON (no Markdown, no prose outside JSON). Keys:\n");
        prompt.append("{\n");
        prompt.append("  \"response\": \"Giải thích bằng tiếng Việt, nêu triệu chứng, tình trạng nghi ngờ, hướng dẫn và nhắc lịch\",\n");
        prompt.append("  \"status\": \"COMPLETE\" or \"NEED_MORE_INFO\",\n");
        prompt.append("  \"department\": {\n");
        prompt.append("      \"name\": \"Tên khoa chính xác\",\n");
        prompt.append("      \"reason\": \"Vì sao nên đến khoa này\",\n");
        prompt.append("      \"suspectedCondition\": \"Bệnh/triệu chứng nghi ngờ\"\n");
        prompt.append("  },\n");
        prompt.append("  \"followUpQuestion\": \"Câu hỏi thêm nếu cần\"\n");
        prompt.append("}\n");
        prompt.append("- When status is NEED_MORE_INFO, department can be null if you truly cannot decide yet.\n");
        prompt.append("- When status is COMPLETE, department.name must match exactly one entry from the directory above.\n");

        return prompt.toString();
    }
    
    private ChatbotResponseDto buildStructuredResponse(String rawResponse, String userMessage, List<Department> departments) {
        if (rawResponse == null || rawResponse.isBlank()) {
            return buildFallbackDto(userMessage);
        }

        String cleanedPayload = cleanJsonPayload(rawResponse);
        if (cleanedPayload.isBlank()) {
            return ChatbotResponseDto.builder()
                .response(rawResponse)
                .needsMoreInfo(false)
                .doctors(Collections.emptyList())
                .build();
        }

        if (!looksLikeJson(cleanedPayload)) {
            return ChatbotResponseDto.builder()
                .response(cleanedPayload)
                .needsMoreInfo(false)
                .doctors(Collections.emptyList())
                .build();
        }

        try {
            JsonNode root = objectMapper.readTree(cleanedPayload);

            String responseText = root.path("response").asText(null);
            String status = root.path("status").asText("");
            boolean needsMoreInfo = root.path("needsMoreInfo").asBoolean(false)
                || "NEED_MORE_INFO".equalsIgnoreCase(status)
                || "FOLLOW_UP".equalsIgnoreCase(status);

            String followUp = root.path("followUpQuestion").asText(null);
            if ((followUp == null || followUp.isBlank()) && needsMoreInfo) {
                followUp = root.path("nextQuestion").asText(null);
            }

            JsonNode departmentNode = root.path("department");
            String aiDeptName = null;
            String reason = null;
            String suspectedCondition = null;
            if (departmentNode != null && !departmentNode.isMissingNode() && !departmentNode.isNull()) {
                if (departmentNode.isTextual()) {
                    aiDeptName = departmentNode.asText();
                } else if (departmentNode.isObject()) {
                    aiDeptName = departmentNode.path("name").asText(null);
                    if (aiDeptName == null || aiDeptName.isBlank()) {
                        aiDeptName = departmentNode.path("department").asText(null);
                    }
                    reason = departmentNode.path("reason").asText(null);
                    if (reason == null || reason.isBlank()) {
                        reason = departmentNode.path("explanation").asText(null);
                    }
                    suspectedCondition = departmentNode.path("suspectedCondition").asText(null);
                    if (suspectedCondition == null || suspectedCondition.isBlank()) {
                        suspectedCondition = departmentNode.path("condition").asText(null);
                    }
                }
            }

            ChatbotResponseDto.DepartmentInfo departmentInfo = resolveDepartmentInfo(
                aiDeptName,
                reason,
                suspectedCondition,
                departments
            );

            List<ChatbotResponseDto.DoctorInfo> doctorInfos = Collections.emptyList();
            if (!needsMoreInfo && departmentInfo != null && departmentInfo.getId() != null) {
                doctorInfos = fetchDoctorsForDepartment(departmentInfo.getId(), departmentInfo.getName());
            }

            return ChatbotResponseDto.builder()
                .response(responseText != null && !responseText.isBlank() ? responseText.trim() : rawResponse)
                .needsMoreInfo(needsMoreInfo)
                .followUpQuestion(followUp)
                .department(departmentInfo)
                .doctors(doctorInfos)
                .build();

        } catch (JsonProcessingException e) {
            log.warn("Failed to parse structured Gemini response, falling back to plain text. Error: {}", e.getMessage());
            return ChatbotResponseDto.builder()
                .response(rawResponse.trim())
                .needsMoreInfo(false)
                .doctors(Collections.emptyList())
                .build();
        }
    }

    private boolean looksLikeJson(String payload) {
        String trimmed = payload.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
    }

    private String cleanJsonPayload(String aiResponse) {
        if (aiResponse == null) {
            return "";
        }
        String cleaned = aiResponse.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace("```json", "")
                .replace("```JSON", "")
                .replace("```", "")
                .trim();
        }
        return cleaned;
    }

    private ChatbotResponseDto.DepartmentInfo resolveDepartmentInfo(
        String aiDeptName,
        String reason,
        String suspectedCondition,
        List<Department> departments
    ) {
        if (aiDeptName == null || aiDeptName.isBlank()) {
            return null;
        }

        Department matched = matchDepartmentByName(aiDeptName, departments);
        if (matched == null) {
            return ChatbotResponseDto.DepartmentInfo.builder()
                .name(aiDeptName.trim())
                .aiProvidedName(aiDeptName.trim())
                .reason(reason)
                .suspectedCondition(suspectedCondition)
                .build();
        }

        return ChatbotResponseDto.DepartmentInfo.builder()
            .id(matched.getId())
            .name(matched.getDepartmentName())
            .description(matched.getDescription())
            .reason(reason)
            .suspectedCondition(suspectedCondition)
            .aiProvidedName(aiDeptName.trim())
            .build();
    }

    private Department matchDepartmentByName(String aiDeptName, List<Department> departments) {
        if (aiDeptName == null || departments == null) {
            return null;
        }

        String normalizedTarget = normalizeText(aiDeptName);
        if (normalizedTarget.isBlank()) {
            return null;
        }

        for (Department dept : departments) {
            if (dept != null && dept.getDepartmentName() != null) {
                if (normalizeText(dept.getDepartmentName()).equals(normalizedTarget)) {
                    return dept;
                }
            }
        }

        for (Department dept : departments) {
            if (dept != null && dept.getDepartmentName() != null) {
                String normalizedDept = normalizeText(dept.getDepartmentName());
                if (!normalizedDept.isBlank() &&
                    (normalizedTarget.contains(normalizedDept) || normalizedDept.contains(normalizedTarget))) {
                    return dept;
                }
            }
        }

        return null;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.replaceAll("[^a-zA-Z0-9 ]", "").toLowerCase().trim();
    }

    private List<ChatbotResponseDto.DoctorInfo> fetchDoctorsForDepartment(Long departmentId, String departmentName) {
        if (departmentId == null) {
            return Collections.emptyList();
        }

        try {
            List<Doctor> doctors = doctorRepository.findByDepartmentWithUserAndRole(departmentId);
            if (doctors == null || doctors.isEmpty()) {
                return Collections.emptyList();
            }

            return doctors.stream()
                .map(doctor -> ChatbotResponseDto.DoctorInfo.builder()
                    .id(doctor.getDoctorId())
                    .fullName(buildDoctorFullName(doctor))
                    .specialty(doctor.getSpecialty())
                    .avatarUrl(doctor.getUser() != null ? doctor.getUser().getAvatarUrl() : null)
                    .departmentId(departmentId)
                    .departmentName(departmentName)
                    .build())
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Failed to load doctors for department {}: {}", departmentId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private String buildDoctorFullName(Doctor doctor) {
        if (doctor == null || doctor.getUser() == null) {
            return "Bác sĩ";
        }
        String first = doctor.getUser().getFirstName() != null ? doctor.getUser().getFirstName() : "";
        String last = doctor.getUser().getLastName() != null ? doctor.getUser().getLastName() : "";
        String fullName = (first + " " + last).trim();
        return fullName.isEmpty() ? "Bác sĩ" : fullName;
    }

    private ChatbotResponseDto buildFallbackDto(String userMessage) {
        return ChatbotResponseDto.builder()
            .response(generateFallbackResponse(userMessage))
            .needsMoreInfo(false)
            .doctors(Collections.emptyList())
            .build();
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
    
    public String getModelName() {
        return model;
    }
}


