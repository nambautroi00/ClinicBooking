package com.example.backend.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.constant.AppConstants;
import com.example.backend.dto.PatientDTO;
import com.example.backend.service.PatientService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService patientService;

    @GetMapping(value = {"", "/"})
    public ResponseEntity<Page<PatientDTO.Response>> getAllPatients(
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = AppConstants.DEFAULT_SORT_FIELD) Pageable pageable) {
        Page<PatientDTO.Response> patients = patientService.getAllPatients(pageable);
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientDTO.Response> getPatientById(@PathVariable Long id) {
        PatientDTO.Response patient = patientService.getPatientById(id);
        return ResponseEntity.ok(patient);
    }

    @PostMapping
    public ResponseEntity<PatientDTO.Response> createPatient(@Valid @RequestBody PatientDTO.Create createDTO) {
        PatientDTO.Response createdPatient = patientService.createPatient(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPatient);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientDTO.Response> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody PatientDTO.Update updateDTO) {
        PatientDTO.Response updatedPatient = patientService.updatePatient(id, updateDTO);
        return ResponseEntity.ok(updatedPatient);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<Void> hardDeletePatient(@PathVariable Long id) {
        patientService.hardDeletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
