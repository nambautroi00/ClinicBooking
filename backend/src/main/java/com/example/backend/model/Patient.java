package com.example.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Patients")

public class Patient {
    @Id
    private Long patientID; // = Users.userID

    @OneToOne
    @MapsId
    @JoinColumn(name = "patientID")
    private User user;

    @Column(length = 50)
    private String healthInsuranceNumber;

    @Lob
    private String medicalHistory;

    public Long getPatientID() {
        return patientID;
    }

    public void setPatientID(Long patientID) {
        this.patientID = patientID;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getHealthInsuranceNumber() {
        return healthInsuranceNumber;
    }

    public void setHealthInsuranceNumber(String healthInsuranceNumber) {
        this.healthInsuranceNumber = healthInsuranceNumber;
    }

    public String getMedicalHistory() {
        return medicalHistory;
    }

    public void setMedicalHistory(String medicalHistory) {
        this.medicalHistory = medicalHistory;
    }

    public Patient() {
    }

    public Patient(Long patientID, User user, String healthInsuranceNumber, String medicalHistory) {
        this.patientID = patientID;
        this.user = user;
        this.healthInsuranceNumber = healthInsuranceNumber;
        this.medicalHistory = medicalHistory;
    }
}
