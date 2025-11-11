package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.model.ClinicalReferral;
import com.example.backend.model.ClinicalReferralStatus;

@Repository
public interface ClinicalReferralRepository extends JpaRepository<ClinicalReferral, Long> {
    
    List<ClinicalReferral> findByToDepartment_IdOrderByCreatedAtDesc(Long departmentId);
    
    List<ClinicalReferral> findByAppointment_AppointmentIdOrderByCreatedAtDesc(Long appointmentId);
    
    List<ClinicalReferral> findByFromDoctor_DoctorIdOrderByCreatedAtDesc(Long doctorId);
    
    List<ClinicalReferral> findByStatusOrderByCreatedAtDesc(ClinicalReferralStatus status);
    
    List<ClinicalReferral> findByToDepartment_IdAndStatusOrderByCreatedAtDesc(
        Long departmentId, 
        ClinicalReferralStatus status
    );
    
    @Query("SELECT r FROM ClinicalReferral r WHERE r.appointment.patient.patientId = :patientId ORDER BY r.createdAt DESC")
    List<ClinicalReferral> findByPatientId(@Param("patientId") Long patientId);
    
    @Query("SELECT COUNT(r) FROM ClinicalReferral r WHERE r.fromDoctor.doctorId = :doctorId AND r.status = 'PENDING'")
    Long countPendingByDoctorId(@Param("doctorId") Long doctorId);
    
    @Query("SELECT COUNT(r) FROM ClinicalReferral r WHERE r.fromDoctor.doctorId = :doctorId " +
           "AND r.status = 'DONE' AND CAST(r.completedAt AS date) = CURRENT_DATE")
    Long countCompletedTodayByDoctorId(@Param("doctorId") Long doctorId);
}
