package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SystemNotifications")

public class SystemNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationID;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false)
    private String message;

    @ManyToOne
    @JoinColumn(name = "appointmentID")
    private Appointment appointment;

    private LocalDateTime createdAt;

    public SystemNotification() {
    }

    public SystemNotification(Long notificationID, String title, String message, Appointment appointment, LocalDateTime createdAt) {
        this.notificationID = notificationID;
        this.title = title;
        this.message = message;
        this.appointment = appointment;
        this.createdAt = createdAt;
    }

    public Long getNotificationID() {
        return notificationID;
    }

    public void setNotificationID(Long notificationID) {
        this.notificationID = notificationID;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
