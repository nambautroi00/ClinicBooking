package com.example.backend.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ReviewDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Create {
        @NotNull(message = "PatientID không được để trống")
        private Long patientId;

        @NotNull(message = "DoctorID không được để trống")
        private Long doctorId;

        @NotNull(message = "Đánh giá không được để trống")
        @Min(value = 1, message = "Đánh giá phải từ 1 đến 5 sao")
        @Max(value = 5, message = "Đánh giá phải từ 1 đến 5 sao")
        private Integer rating;

        @Size(max = 1000, message = "Bình luận không quá 1000 ký tự")
        private String comment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Update {
        @Min(value = 1, message = "Đánh giá phải từ 1 đến 5 sao")
        @Max(value = 5, message = "Đánh giá phải từ 1 đến 5 sao")
        private Integer rating;

        @Size(max = 1000, message = "Bình luận không quá 1000 ký tự")
        private String comment;

        @Size(max = 20, message = "Trạng thái không quá 20 ký tự")
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long reviewId;
        private Long patientId;
        private String patientName;
        private Long doctorId;
        private String doctorName;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
        private String status;
    }
}

