package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, Integer> {
    boolean existsByUser_Email(String email);

    @Query("SELECT d FROM Doctor d WHERE d.status IS NULL OR d.status = 'ACTIVE'")
    java.util.List<Doctor> findAllActive();

    @Query("SELECT d FROM Doctor d WHERE d.doctorId = :id AND (d.status IS NULL OR d.status = 'ACTIVE')")
    java.util.Optional<Doctor> findActiveById(@Param("id") Integer id);
}