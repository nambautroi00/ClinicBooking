package com.example.backend.dto;

import com.example.backend.model.Department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class DepartmentDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Create {
        @NotBlank(message = "Tên khoa không được để trống")
        @Size(max = 100, message = "Tên khoa không được quá 100 ký tự")
        private String departmentName;

        @Size(max = 255, message = "Mô tả không được quá 255 ký tự")
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Update {
        @Size(max = 100, message = "Tên khoa không được quá 100 ký tự")
        private String departmentName;

        @Size(max = 255, message = "Mô tả không được quá 255 ký tự")
        private String description;

        private Department.DepartmentStatus status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String departmentName;
        private String description;
        private Department.DepartmentStatus status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Statistics {
        private long totalDepartments;
        private long activeDepartments;
        private long inactiveDepartments;
        private long maintenanceDepartments;
        private long closedDepartments;
        private long departmentsWithDoctors;
        private long departmentsWithoutDoctors;
    }
}