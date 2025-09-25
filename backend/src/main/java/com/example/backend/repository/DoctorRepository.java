package com.example.backend.repository;

import com.example.backend.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, Integer> {
    boolean existsByUser_Email(String email);
}