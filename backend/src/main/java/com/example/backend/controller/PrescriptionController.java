package com.example.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

import com.example.backend.dto.PrescriptionDto;
import com.example.backend.service.PrescriptionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    @Autowired
    private PrescriptionService prescriptionService;

    @GetMapping
    public ResponseEntity<List<PrescriptionDto>> getAllPrescriptions() {
        List<PrescriptionDto> prescriptions = prescriptionService.getAllPrescriptions();
        return ResponseEntity.ok(prescriptions);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<PrescriptionDto>> getAllPrescriptionsPaged(Pageable pageable) {
        Page<PrescriptionDto> prescriptions = prescriptionService.getAllPrescriptions(pageable);
        return ResponseEntity.ok(prescriptions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionDto> getPrescriptionById(@PathVariable Integer id) {
        PrescriptionDto prescription = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(prescription);
    }

    @GetMapping("/record/{recordId}")
    public ResponseEntity<List<PrescriptionDto>> getPrescriptionsByRecordId(@PathVariable Integer recordId) {
        List<PrescriptionDto> prescriptions = prescriptionService.getPrescriptionsByRecordId(recordId);
        return ResponseEntity.ok(prescriptions);
    }

    @PostMapping
    public ResponseEntity<PrescriptionDto> createPrescription(@Valid @RequestBody PrescriptionDto requestDto) {
        PrescriptionDto createdPrescription = prescriptionService.createPrescription(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPrescription);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrescriptionDto> updatePrescription(@PathVariable Integer id, 
                                                            @Valid @RequestBody PrescriptionDto requestDto) {
        PrescriptionDto updatedPrescription = prescriptionService.updatePrescription(id, requestDto);
        return ResponseEntity.ok(updatedPrescription);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(@PathVariable Integer id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.noContent().build();
    }
}