package com.example.backend.dto;

import java.time.LocalDateTime;
import java.math.BigDecimal;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AppointmentDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Create {
        @NotNull(message = "PatientID không được để trống")
        private Long patientId;

        @NotNull(message = "DoctorID không được để trống")
        private Long doctorId;

        private Long scheduleId;

        @NotNull(message = "Ngày bắt đầu không được để trống")
        @Future(message = "Ngày bắt đầu phải ở tương lai")
        private LocalDateTime startTime;

        @NotNull(message = "Ngày kết thúc không được để trống")
        @Future(message = "Ngày kết thúc phải ở tương lai")
        private LocalDateTime endTime;

        @Size(max = 255, message = "Ghi chú không quá 255 ký tự")
        private String notes;

        private BigDecimal fee;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Update {
        @Future(message = "Ngày bắt đầu phải ở tương lai")
        private LocalDateTime startTime;

        @Future(message = "Ngày kết thúc phải ở tương lai")
        private LocalDateTime endTime;

        @Size(max = 30, message = "Trạng thái không quá 30 ký tự")
        private String status;

        @Size(max = 255, message = "Ghi chú không quá 255 ký tự")
        private String notes;

        private BigDecimal fee;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
    private Long appointmentId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long scheduleId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String notes;
    private BigDecimal fee;
    }
}


