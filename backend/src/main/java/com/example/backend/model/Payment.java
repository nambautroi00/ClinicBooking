package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    @OneToOne
    @JoinColumn(name = "AppointmentID", nullable = false)
    private Appointment appointment;


    @Column(nullable = false)
    private String paymentMethod;

    @Column(columnDefinition = "NVARCHAR(20) DEFAULT 'Pending'")
    private String paymentStatus = "Pending";

    private LocalDateTime paidAt;
    private String notes;
}