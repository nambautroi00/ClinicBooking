package com.example.backend.dto;

import lombok.Data;

@Data
public class DoctorDTO {
    private Integer doctorId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String specialty;
    private String bio;
    private Integer departmentId;
}