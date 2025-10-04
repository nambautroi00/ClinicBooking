package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class PrescriptionDto {
    private Long prescriptionId;
    
    @NotNull(message = "Medical record ID is required")
    private Long recordId;
    
    private String notes;
    private LocalDateTime createdAt;
    
    @Valid
    private List<PrescriptionItemDto> items;

    // Constructors
    public PrescriptionDto() {}

    // Constructor for response (with all fields)
    public PrescriptionDto(Long prescriptionId, Long recordId, String notes, LocalDateTime createdAt, List<PrescriptionItemDto> items) {
        this.prescriptionId = prescriptionId;
        this.recordId = recordId;
        this.notes = notes;
        this.createdAt = createdAt;
        this.items = items;
    }

    // Constructor for request (without prescriptionId and createdAt)
    public PrescriptionDto(Long recordId, String notes, List<PrescriptionItemDto> items) {
        this.recordId = recordId;
        this.notes = notes;
        this.items = items;
    }

    // Getters and Setters
    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<PrescriptionItemDto> getItems() { return items; }
    public void setItems(List<PrescriptionItemDto> items) { this.items = items; }
}