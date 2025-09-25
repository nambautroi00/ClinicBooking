package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.Patient;

public interface PatientRepository extends JpaRepository<Patient, Integer> {
    boolean existsByUser_Email(String email);

    @Query("SELECT p FROM Patient p WHERE p.status = 'ACTIVE'")
    java.util.List<Patient> findAllActive();

    @Query("SELECT p FROM Patient p WHERE p.patientId = :id AND p.status = 'ACTIVE'")
    java.util.Optional<Patient> findActiveById(@Param("id") Integer id);
}