package com.example.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import com.example.backend.validation.CreateValidation;

@Data
public class PatientDTO {
    private Integer patientId;
    private String createdAt;
    private String status;
    private String img;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Password is required", groups = CreateValidation.class)
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;
    
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;
    
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phone;
    
    @Size(max = 1, message = "Gender must be M, F, or O")
    private String gender;
    
    private String dob;
    
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;
    
    @Size(max = 50, message = "Health insurance number must not exceed 50 characters")
    private String healthInsuranceNumber;
    
    @Size(max = 1000, message = "Medical history must not exceed 1000 characters")
    private String medicalHistory;
}