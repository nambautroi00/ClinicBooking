package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Patients")
public class Patient {
    @Id
    private Integer patientId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "PatientID")
    private User user;

    private String healthInsuranceNumber;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String medicalHistory;

    @OneToMany(mappedBy = "patient")
    private List<Appointment> appointments;

    @OneToMany(mappedBy = "patient")
    private List<Review> reviews;
}