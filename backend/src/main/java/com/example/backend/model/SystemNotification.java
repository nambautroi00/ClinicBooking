package com.example.backend.model;

import jakarta.persistence.*;
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
    private Long notificationId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String message;

    @ManyToOne
    @JoinColumn(name = "AppointmentID")
    private Appointment appointment;

    private LocalDateTime createdAt;
}