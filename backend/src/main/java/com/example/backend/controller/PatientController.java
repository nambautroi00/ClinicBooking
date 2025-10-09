package com.example.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.backend.model.Patient;
import com.example.backend.service.PatientService;

import lombok.RequiredArgsConstructor;

/**
 * REST Controller cho Patient entity
 * Cung cấp các API endpoints để quản lý thông tin bệnh nhân
 */
@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService patientService;


    /**
     * Lấy tất cả bệnh nhân với thông tin User và Role
     * GET /api/patients
     */
    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatientsWithUserAndRole() {
        List<Patient> patients = patientService.getAllPatientsWithUserAndRole();
        return ResponseEntity.ok(patients);
    }

    /**
     * Lấy bệnh nhân theo ID với thông tin User và Role
     * GET /api/patients/{patientId}
     */
    @GetMapping("/{patientId}")
    public ResponseEntity<Patient> getPatientByIdWithUserAndRole(@PathVariable Long patientId) {
        Patient patient = patientService.getPatientByIdWithUserAndRole(patientId);
        return ResponseEntity.ok(patient);
    }

    /**
     * Tìm bệnh nhân theo tên với thông tin User và Role
     * GET /api/patients/search?keyword={keyword}
     */
    @GetMapping("/search")
    public ResponseEntity<List<Patient>> getPatientsByNameWithUserAndRole(@RequestParam String keyword) {
        List<Patient> patients = patientService.getPatientsByNameWithUserAndRole(keyword);
        return ResponseEntity.ok(patients);
    }

    /**
     * Tìm bệnh nhân theo số bảo hiểm y tế với thông tin User và Role
     * GET /api/patients/insurance/{insuranceNumber}
     */
    @GetMapping("/insurance/{insuranceNumber}")
    public ResponseEntity<Patient> getPatientByInsuranceNumberWithUserAndRole(@PathVariable String insuranceNumber) {
        Optional<Patient> patient = patientService.getPatientByInsuranceNumberWithUserAndRole(insuranceNumber);
        return patient.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Tìm bệnh nhân theo email với thông tin User và Role
     * GET /api/patients/email/{email}
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<Patient> getPatientByEmailWithUserAndRole(@PathVariable String email) {
        Optional<Patient> patient = patientService.getPatientByEmailWithUserAndRole(email);
        return patient.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lấy bệnh nhân theo userId
     * GET /api/patients/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Patient> getPatientByUserId(@PathVariable Long userId) {
        Patient patient = patientService.getPatientByUserId(userId);
        return ResponseEntity.ok(patient);
    }

    /**
     * Tạo bệnh nhân mới
     * POST /api/patients
     */
    @PostMapping
    public ResponseEntity<Patient> createPatient(@RequestBody CreatePatientRequest request) {
        Patient patient = patientService.createPatient(
            request.getUserId(),
            request.getHealthInsuranceNumber(),
            request.getMedicalHistory()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(patient);
    }

    /**
     * Cập nhật thông tin bệnh nhân
     * PUT /api/patients/{patientId}
     */
    @PutMapping("/{patientId}")
    public ResponseEntity<Patient> updatePatient(@PathVariable Long patientId, @RequestBody UpdatePatientRequest request) {
        Patient patient = patientService.updatePatient(
            patientId,
            request.getHealthInsuranceNumber(),
            request.getMedicalHistory(),
            request.getStatus()
        );
        return ResponseEntity.ok(patient);
    }

    /**
     * Xóa bệnh nhân (soft delete)
     * DELETE /api/patients/{patientId}
     */
    @DeleteMapping("/{patientId}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long patientId) {
        patientService.deletePatient(patientId);
        return ResponseEntity.noContent().build();
    }


    /**
     * Kiểm tra user đã có thông tin bệnh nhân chưa
     * GET /api/patients/check/{userId}
     */
    @GetMapping("/check/{userId}")
    public ResponseEntity<Boolean> isUserPatient(@PathVariable Long userId) {
        boolean isPatient = patientService.isUserPatient(userId);
        return ResponseEntity.ok(isPatient);
    }

    /**
     * Đăng ký bệnh nhân mới (tạo cả User và Patient)
     * POST /api/patients/register
     */
    @PostMapping("/register")
    public ResponseEntity<String> registerPatient(@RequestBody PatientService.PatientRegisterRequest request) {
        patientService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("Đăng ký bệnh nhân thành công");
    }

    /**
     * Request DTO cho tạo bệnh nhân mới
     */
    public static class CreatePatientRequest {
        private Long userId;
        private String healthInsuranceNumber;
        private String medicalHistory;

        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        
        public String getMedicalHistory() { return medicalHistory; }
        public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
    }

    /**
     * Request DTO cho cập nhật bệnh nhân
     */
    public static class UpdatePatientRequest {
        private String healthInsuranceNumber;
        private String medicalHistory;
        private String status;

        // Getters and Setters
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        
        public String getMedicalHistory() { return medicalHistory; }
        public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}