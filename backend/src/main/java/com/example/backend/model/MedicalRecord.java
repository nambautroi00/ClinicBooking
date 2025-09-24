package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "MedicalRecords")

public class MedicalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recordID;

    @ManyToOne
    @JoinColumn(name = "appointmentID", nullable = false)
    private Appointment appointment;

    @Column(length = 255)
    private String diagnosis;

    @Column(length = 255)
    private String advice;

    private LocalDateTime createdAt;

    public MedicalRecord() {
    }

    public MedicalRecord(Long recordID, Appointment appointment, String diagnosis, String advice, LocalDateTime createdAt) {
        this.recordID = recordID;
        this.appointment = appointment;
        this.diagnosis = diagnosis;
        this.advice = advice;
        this.createdAt = createdAt;
    }

    public Long getRecordID() {
        return recordID;
    }

    public void setRecordID(Long recordID) {
        this.recordID = recordID;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getAdvice() {
        return advice;
    }

    public void setAdvice(String advice) {
        this.advice = advice;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
