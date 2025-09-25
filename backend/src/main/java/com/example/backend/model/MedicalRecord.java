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
@Table(name = "MedicalRecords")
public class MedicalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer recordId;

    @OneToOne
    @JoinColumn(name = "AppointmentID", nullable = false)
    private Appointment appointment;

    private String diagnosis;
    private String advice;

    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "medicalRecord")
    private Prescription prescription;
}