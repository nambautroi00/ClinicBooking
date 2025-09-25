package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.Department;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    
}
