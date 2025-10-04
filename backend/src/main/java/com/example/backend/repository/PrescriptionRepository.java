package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.model.Prescription;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    List<Prescription> findByMedicalRecordRecordId(Integer recordId);
}
