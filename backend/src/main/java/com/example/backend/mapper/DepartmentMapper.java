package com.example.backend.mapper;

import org.springframework.stereotype.Component;

import com.example.backend.dto.DepartmentDTO;
import com.example.backend.model.Department;

@Component
public class DepartmentMapper {

    public Department createDTOToEntity(DepartmentDTO.Create createDTO) {
        Department department = new Department();
        department.setDepartmentName(createDTO.getDepartmentName());
        department.setDescription(createDTO.getDescription());
        department.setStatus(Department.DepartmentStatus.ACTIVE);
        return department;
    }

    public DepartmentDTO.Response entityToResponseDTO(Department department) {
        DepartmentDTO.Response dto = new DepartmentDTO.Response();
        dto.setId(department.getId());
        dto.setDepartmentName(department.getDepartmentName());
        dto.setDescription(department.getDescription());
        dto.setStatus(department.getStatus());
        return dto;
    }
}