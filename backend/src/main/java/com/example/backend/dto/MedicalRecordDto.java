package com.example.backend.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

public class MedicalRecordDto {
    private Integer recordId;
    
    @NotNull(message = "Appointment ID is required")
    private Long appointmentId;
    
    private String diagnosis;
    private String advice;
    private LocalDateTime createdAt;
    
    private PrescriptionDto prescription;

    // Constructors
    public MedicalRecordDto() {}

    // Constructor for response (with all fields including ID)
    public MedicalRecordDto(Integer recordId, Long appointmentId, String diagnosis, String advice, LocalDateTime createdAt) {
        this.recordId = recordId;
        this.appointmentId = appointmentId;
        this.diagnosis = diagnosis;
        this.advice = advice;
        this.createdAt = createdAt;
    }

    // Constructor for request (without ID and createdAt for new records)
    public MedicalRecordDto(Long appointmentId, String diagnosis, String advice) {
        this.appointmentId = appointmentId;
        this.diagnosis = diagnosis;
        this.advice = advice;
    }

    // Getters and Setters
    public Integer getRecordId() { return recordId; }
    public void setRecordId(Integer recordId) { this.recordId = recordId; }

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getAdvice() { return advice; }
    public void setAdvice(String advice) { this.advice = advice; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public PrescriptionDto getPrescription() { return prescription; }
    public void setPrescription(PrescriptionDto prescription) { this.prescription = prescription; }
}