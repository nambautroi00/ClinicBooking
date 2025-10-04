package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.model.PrescriptionItem;

@Repository
public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, Integer> {
    List<PrescriptionItem> findByPrescriptionPrescriptionId(Integer prescriptionId);
    List<PrescriptionItem> findByMedicineMedicineId(Integer medicineId);
}
