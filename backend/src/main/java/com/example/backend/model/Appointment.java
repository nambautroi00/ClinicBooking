package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appointmentId;

    @ManyToOne
    @JoinColumn(name = "PatientID", nullable = true)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "DoctorID", nullable = false)
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "ScheduleID")
    private DoctorSchedule schedule;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(columnDefinition = "NVARCHAR(30) DEFAULT 'Scheduled'")
    private String status = "Scheduled";

    private String notes;

    @Column(name = "Fee")
    private BigDecimal fee;

    @OneToOne(mappedBy = "appointment")
    private MedicalRecord medicalRecord;

    @OneToOne(mappedBy = "appointment")
    private Payment payment;
}