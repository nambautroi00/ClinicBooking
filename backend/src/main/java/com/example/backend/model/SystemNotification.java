package com.example.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "SystemNotifications")
public class SystemNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NotificationID")
    private Long notificationId;

    @NotNull(message = "User ID không được để trống")
    @Column(name = "UserID", nullable = false)
    private Long userId;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề không được quá 255 ký tự")
    @Column(name = "Title", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String title;

    @NotBlank(message = "Nội dung không được để trống")
    @Column(name = "Message", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Size(max = 50, message = "Loại thông báo không được quá 50 ký tự")
    @Column(name = "Type", columnDefinition = "NVARCHAR(50)")
    private String type = "general";

    @Column(name = "IsRead")
    private Boolean isRead = false;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "ReadAt")
    private LocalDateTime readAt;

    @Column(name = "EmailSent")
    private Boolean emailSent = false;

    @Column(name = "EmailSentAt")
    private LocalDateTime emailSentAt;

    @ManyToOne
    @JoinColumn(name = "AppointmentID")
    private Appointment appointment;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Enum cho các loại thông báo
    public enum NotificationType {
        APPOINTMENT("appointment"),
        REMINDER("reminder"),
        RESULT("result"),
        CANCELLATION("cancellation"),
        GENERAL("general"),
        PAYMENT("payment"),
        SYSTEM("system");

        private final String value;

        NotificationType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }
}