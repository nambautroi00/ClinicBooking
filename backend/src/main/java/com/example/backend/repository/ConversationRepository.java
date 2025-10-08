package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.Conversation;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    @Query("SELECT c FROM Conversation c WHERE c.patient.patientId = :patientId")
    List<Conversation> findByPatientId(@Param("patientId") Long patientId);
    
    @Query("SELECT c FROM Conversation c WHERE c.doctor.doctorId = :doctorId")
    List<Conversation> findByDoctorId(@Param("doctorId") Long doctorId);
    
    @Query("SELECT c FROM Conversation c WHERE c.patient.patientId = :patientId AND c.doctor.doctorId = :doctorId")
    Optional<Conversation> findByPatientIdAndDoctorId(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId);
    
    @Query("SELECT c FROM Conversation c WHERE c.patient.patientId = :patientId ORDER BY c.createdAt DESC")
    List<Conversation> findByPatientIdOrderByCreatedAtDesc(@Param("patientId") Long patientId);
    
    @Query("SELECT c FROM Conversation c WHERE c.doctor.doctorId = :doctorId ORDER BY c.createdAt DESC")
    List<Conversation> findByDoctorIdOrderByCreatedAtDesc(@Param("doctorId") Long doctorId);
    
    @Query("SELECT COUNT(c) FROM Conversation c WHERE c.patient.patientId = :patientId")
    Long countByPatientId(@Param("patientId") Long patientId);
    
    @Query("SELECT COUNT(c) FROM Conversation c WHERE c.doctor.doctorId = :doctorId")
    Long countByDoctorId(@Param("doctorId") Long doctorId);
    
    @Query("SELECT c FROM Conversation c LEFT JOIN FETCH c.messages WHERE c.conversationId = :conversationId")
    Optional<Conversation> findByIdWithMessages(@Param("conversationId") Long conversationId);
    
    @Query("SELECT c FROM Conversation c LEFT JOIN FETCH c.messages WHERE c.patient.patientId = :patientId AND c.doctor.doctorId = :doctorId")
    Optional<Conversation> findByPatientAndDoctorWithMessages(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId);
}
