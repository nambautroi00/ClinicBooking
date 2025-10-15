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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.constant.AppConstants;
import com.example.backend.dto.DepartmentDTO;
import com.example.backend.model.Department;
import com.example.backend.service.DepartmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<Page<DepartmentDTO.Response>> getAllDepartments(
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = "departmentName") Pageable pageable) {
        Page<DepartmentDTO.Response> departments = departmentService.getAllDepartments(pageable);
        return ResponseEntity.ok(departments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDTO.Response> getDepartmentById(@PathVariable Long id) {
        DepartmentDTO.Response department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(department);
    }

    @GetMapping("/name/{departmentName}")
    public ResponseEntity<DepartmentDTO.Response> getDepartmentByName(@PathVariable String departmentName) {
        DepartmentDTO.Response department = departmentService.getDepartmentByName(departmentName);
        return ResponseEntity.ok(department);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DepartmentDTO.Response>> searchDepartments(
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) Department.DepartmentStatus status,
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = "departmentName") Pageable pageable) {
        
        Page<DepartmentDTO.Response> departments = departmentService.searchDepartments(departmentName, status, pageable);
        return ResponseEntity.ok(departments);
    }

    @PostMapping
    public ResponseEntity<DepartmentDTO.Response> createDepartment(@Valid @RequestBody DepartmentDTO.Create createDTO) {
        DepartmentDTO.Response createdDepartment = departmentService.createDepartment(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDepartment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentDTO.Response> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentDTO.Update updateDTO) {
        DepartmentDTO.Response updatedDepartment = departmentService.updateDepartment(id, updateDTO);
        return ResponseEntity.ok(updatedDepartment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DepartmentDTO.Response> changeStatus(
            @PathVariable Long id,
            @RequestParam Department.DepartmentStatus status) {
        DepartmentDTO.Response updatedDepartment = departmentService.changeStatus(id, status);
        return ResponseEntity.ok(updatedDepartment);
    }

    @GetMapping("/statistics")
    public ResponseEntity<DepartmentDTO.Statistics> getStatistics() {
        DepartmentDTO.Statistics stats = departmentService.getDepartmentStatistics();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/active")
    public ResponseEntity<Page<DepartmentDTO.Response>> getActiveDepartments(
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = "departmentName") Pageable pageable) {
        Page<DepartmentDTO.Response> departments = departmentService.getActiveDepartments(pageable);
        return ResponseEntity.ok(departments);
    }
}