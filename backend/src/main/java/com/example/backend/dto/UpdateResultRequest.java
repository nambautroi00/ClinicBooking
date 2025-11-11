package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateResultRequest {
    private Long performedByDoctorId;
    private String resultText;
    private String resultFileUrl;
}
