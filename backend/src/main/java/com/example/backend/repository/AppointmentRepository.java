package com.example.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatient_PatientId(Long patientId);
    List<Appointment> findByDoctor_DoctorId(Long doctorId);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.doctorId = :doctorId AND a.startTime BETWEEN :start AND :end")
    List<Appointment> findDoctorAppointmentsInRange(@Param("doctorId") Long doctorId,
                                                    @Param("start") LocalDateTime start,
                                                    @Param("end") LocalDateTime end);
}


