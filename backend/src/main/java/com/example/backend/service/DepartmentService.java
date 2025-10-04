package com.example.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.DepartmentDTO;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.DepartmentMapper;
import com.example.backend.model.Department;
import com.example.backend.repository.DepartmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    @Transactional(readOnly = true)
    public Page<DepartmentDTO.Response> getAllDepartments(Pageable pageable) {
        return departmentRepository.findAll(pageable)
                .map(departmentMapper::entityToResponseDTO);
    }

    @Transactional(readOnly = true)
    public DepartmentDTO.Response getDepartmentById(Long id) {
        Department department = findDepartmentById(id);
        return departmentMapper.entityToResponseDTO(department);
    }

    @Transactional(readOnly = true)
    public DepartmentDTO.Response getDepartmentByName(String departmentName) {
        Department department = departmentRepository.findByDepartmentName(departmentName)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khoa với tên: " + departmentName));
        return departmentMapper.entityToResponseDTO(department);
    }

    @Transactional(readOnly = true)
    public Page<DepartmentDTO.Response> searchDepartments(String departmentName, 
                                                        Department.DepartmentStatus status, 
                                                        Pageable pageable) {
        return departmentRepository.findDepartmentsWithFilters(departmentName, status, pageable)
                .map(departmentMapper::entityToResponseDTO);
    }

    @Transactional(readOnly = true)
    public Page<DepartmentDTO.Response> getActiveDepartments(Pageable pageable) {
        return departmentRepository.findByStatus(Department.DepartmentStatus.ACTIVE, pageable)
                .map(departmentMapper::entityToResponseDTO);
    }

    public DepartmentDTO.Response createDepartment(DepartmentDTO.Create createDTO) {
        validateDepartmentNameNotExists(createDTO.getDepartmentName());
        
        Department department = departmentMapper.createDTOToEntity(createDTO);
        Department savedDepartment = departmentRepository.save(department);
        
        return departmentMapper.entityToResponseDTO(savedDepartment);
    }

    public DepartmentDTO.Response updateDepartment(Long id, DepartmentDTO.Update updateDTO) {
        Department department = findDepartmentById(id);
        updateDepartmentFields(department, updateDTO);
        Department updatedDepartment = departmentRepository.save(department);
        return departmentMapper.entityToResponseDTO(updatedDepartment);
    }

    public void deleteDepartment(Long id) {
        Department department = findDepartmentById(id);
        // Soft delete - chỉ thay đổi status
        department.setStatus(Department.DepartmentStatus.INACTIVE);
        departmentRepository.save(department);
    }

    public void hardDeleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy khoa với ID: " + id);
        }
        departmentRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public long getActiveDepartmentCount() {
        return departmentRepository.countActiveDepartments();
    }

    // Helper Methods
    private void validateDepartmentNameNotExists(String departmentName) {
        if (departmentRepository.existsByDepartmentName(departmentName)) {
            throw new ConflictException("Tên khoa đã tồn tại: " + departmentName);
        }
    }

    private Department findDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khoa với ID: " + id));
    }

    private void updateDepartmentFields(Department department, DepartmentDTO.Update updateDTO) {
        updateDepartmentNameIfChanged(department, updateDTO.getDepartmentName());
        
        if (updateDTO.getDescription() != null) {
            department.setDescription(updateDTO.getDescription());
        }
        
        if (updateDTO.getStatus() != null) {
            department.setStatus(updateDTO.getStatus());
        }
    }

    private void updateDepartmentNameIfChanged(Department department, String newDepartmentName) {
        if (newDepartmentName != null && !newDepartmentName.equals(department.getDepartmentName())) {
            validateDepartmentNameNotExists(newDepartmentName);
            department.setDepartmentName(newDepartmentName);
        }
    }
}