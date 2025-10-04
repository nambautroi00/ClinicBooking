package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Patients")
public class Patient {
    @Id
    @Column(name = "PatientID")
    private Long patientId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "PatientID")
    private User user;

    @Column(name = "HealthInsuranceNumber")
    private String healthInsuranceNumber;

    @Column(name = "MedicalHistory", columnDefinition = "NVARCHAR(MAX)")
    private String medicalHistory;

    @Column(name = "CreatedAt")
    private LocalDate createdAt;

    @Column(name = "Status")
    private String status;

    @OneToMany(mappedBy = "patient")
    private List<Appointment> appointments;

    @OneToMany(mappedBy = "patient")
    private List<Review> reviews;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDate.now();
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "ACTIVE";
        }
    }
}