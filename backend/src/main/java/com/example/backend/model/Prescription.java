package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Prescriptions")
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long prescriptionID;

    @ManyToOne
    @JoinColumn(name = "recordID", nullable = false)
    private MedicalRecord medicalRecord;

    private LocalDateTime createdAt;

    @Column(length = 255)
    private String notes;

    public Prescription() {
    }

    public Prescription(Long prescriptionID, MedicalRecord medicalRecord, LocalDateTime createdAt, String notes) {
        this.prescriptionID = prescriptionID;
        this.medicalRecord = medicalRecord;
        this.createdAt = createdAt;
        this.notes = notes;
    }

    public Long getPrescriptionID() {
        return prescriptionID;
    }

    public void setPrescriptionID(Long prescriptionID) {
        this.prescriptionID = prescriptionID;
    }

    public MedicalRecord getMedicalRecord() {
        return medicalRecord;
    }

    public void setMedicalRecord(MedicalRecord medicalRecord) {
        this.medicalRecord = medicalRecord;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
