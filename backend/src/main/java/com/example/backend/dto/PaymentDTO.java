package com.example.backend.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class PaymentDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Create {
        @NotNull(message = "AppointmentId không được để trống")
        private Long appointmentId;


        @NotNull(message = "Phương thức thanh toán không được để trống")
        @Size(max = 50, message = "Phương thức thanh toán không được quá 50 ký tự")
        private String paymentMethod;

        @Size(max = 255, message = "Ghi chú không được quá 255 ký tự")
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Update {

        @Size(max = 50, message = "Phương thức thanh toán không được quá 50 ký tự")
        private String paymentMethod;

        @Size(max = 20, message = "Trạng thái không được quá 20 ký tự")
        private String paymentStatus; // Pending, Paid, Failed, Refunded

        private LocalDateTime paidAt;

        @Size(max = 255, message = "Ghi chú không được quá 255 ký tự")
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResponseDTO {
        private Long paymentId;
        private Long appointmentId;
        private String orderId;
        private java.math.BigDecimal amount;
        private String status;
        private String transactionId;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime paidAt;
        private LocalDateTime updatedAt;
    }
}


