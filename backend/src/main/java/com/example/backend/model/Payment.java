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
    @Column(name = "PaymentID")
    private Long paymentId;

    @Column(name = "OrderID", nullable = false, unique = true, length = 100)
    private String orderId;

    @OneToOne
    @JoinColumn(name = "AppointmentID", nullable = false)
    private Appointment appointment;

    @Column(name = "Amount", nullable = false, precision = 12, scale = 2)
    private java.math.BigDecimal amount;

    @Column(name = "Status", length = 20, columnDefinition = "NVARCHAR(20) DEFAULT 'Pending'")
    private String status = "Pending";

    @Column(name = "TransactionID", length = 100)
    private String transactionId;

    @Column(name = "Description", length = 255)
    private String description;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "PaidAt")
    private LocalDateTime paidAt;

    @Column(name = "UpdatedAt", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}