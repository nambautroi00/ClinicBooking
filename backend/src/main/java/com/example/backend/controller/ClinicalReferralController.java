package com.example.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.CreateReferralRequest;
import com.example.backend.dto.UpdateResultRequest;
import com.example.backend.model.ClinicalReferral;
import com.example.backend.model.ClinicalReferralStatus;
import com.example.backend.service.ClinicalReferralService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/clinical-referrals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClinicalReferralController {

    private final ClinicalReferralService referralService;

    @PostMapping
    public ResponseEntity<ClinicalReferral> createReferral(@RequestBody CreateReferralRequest request) {
        return ResponseEntity.ok(referralService.createReferral(request));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<ClinicalReferral>> getReferralsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(referralService.getByDoctor(doctorId));
    }

    @GetMapping("/doctor/{doctorId}/stats")
    public ResponseEntity<Map<String, Long>> getDoctorStats(@PathVariable Long doctorId) {
        Map<String, Long> stats = new HashMap<>();
        stats.put("pendingReferrals", referralService.countPendingByDoctor(doctorId));
        stats.put("completedToday", referralService.countCompletedTodayByDoctor(doctorId));
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<ClinicalReferral>> getReferralsByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(referralService.getByAppointment(appointmentId));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<ClinicalReferral>> getReferralsByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(referralService.getByDepartment(departmentId));
    }

    @GetMapping("/department/{departmentId}/pending")
    public ResponseEntity<List<ClinicalReferral>> getPendingReferrals(@PathVariable Long departmentId) {
        return ResponseEntity.ok(referralService.getPendingByDepartment(departmentId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ClinicalReferral> updateStatus(
            @PathVariable Long id,
            @RequestParam ClinicalReferralStatus status) {
        return ResponseEntity.ok(referralService.updateStatus(id, status));
    }

    @PutMapping("/{id}/result")
    public ResponseEntity<ClinicalReferral> updateResult(
            @PathVariable Long id,
            @RequestBody UpdateResultRequest request) {
        return ResponseEntity.ok(referralService.updateResult(id, request));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ClinicalReferral>> getReferralsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(referralService.getByPatient(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClinicalReferral> getReferral(@PathVariable Long id) {
        return ResponseEntity.ok(referralService.getById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReferral(@PathVariable Long id) {
        referralService.deleteReferral(id);
        return ResponseEntity.noContent().build();
    }
}
