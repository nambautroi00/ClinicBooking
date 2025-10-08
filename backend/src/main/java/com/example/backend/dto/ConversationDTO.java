package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ConversationDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Create {
        @NotNull(message = "PatientID không được để trống")
        private Long patientId;

        @NotNull(message = "DoctorID không được để trống")
        private Long doctorId;
    }

    @Data
    @NoArgsConstructor
    public static class Update {
        // Conversation không có trường nào cần update
        // Chỉ có thể tạo mới hoặc xóa
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long conversationId;
        private Long patientId;
        private String patientName;
        private Long doctorId;
        private String doctorName;
        private LocalDateTime createdAt;
        private List<MessageDTO.Response> messages;
        private Long messageCount;
        private LocalDateTime lastMessageTime;
    }
}
