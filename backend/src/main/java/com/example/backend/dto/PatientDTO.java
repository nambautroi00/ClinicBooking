package com.example.backend.dto;

import lombok.Data;

@Data
public class PatientDTO {
    private Integer patientId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String healthInsuranceNumber;
    private String medicalHistory;
}