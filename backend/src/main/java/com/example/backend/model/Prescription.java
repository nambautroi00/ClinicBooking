package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Prescriptions")
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer prescriptionId;

    @OneToOne
    @JoinColumn(name = "RecordID", nullable = false)
    private MedicalRecord medicalRecord;

    private LocalDateTime createdAt;
    private String notes;

    @OneToMany(mappedBy = "prescription")
    private List<PrescriptionItem> items;
}