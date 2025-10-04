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
import com.example.backend.dto.DoctorDTO;
import com.example.backend.service.DoctorService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping(value = {"", "/"})
    public ResponseEntity<Page<DoctorDTO.Response>> getAllDoctors(
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = AppConstants.DEFAULT_SORT_FIELD) Pageable pageable) {
        Page<DoctorDTO.Response> doctors = doctorService.getAllDoctors(pageable);
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDTO.Response> getDoctorById(@PathVariable Long id) {
        DoctorDTO.Response doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(doctor);
    }

    @PostMapping
    public ResponseEntity<DoctorDTO.Response> createDoctor(@Valid @RequestBody DoctorDTO.Create createDTO) {
        DoctorDTO.Response createdDoctor = doctorService.createDoctor(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDoctor);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DoctorDTO.Response> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody DoctorDTO.Update updateDTO) {
        DoctorDTO.Response updatedDoctor = doctorService.updateDoctor(id, updateDTO);
        return ResponseEntity.ok(updatedDoctor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<Void> hardDeleteDoctor(@PathVariable Long id) {
        doctorService.hardDeleteDoctor(id);
        return ResponseEntity.noContent().build();
    }
}
