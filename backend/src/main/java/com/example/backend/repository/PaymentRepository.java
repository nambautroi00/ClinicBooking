package com.example.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.model.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p JOIN p.appointment a WHERE " +
           "(:status IS NULL OR p.paymentStatus = :status) AND " +
           "(:method IS NULL OR p.paymentMethod = :method) AND " +
           "(:appointmentId IS NULL OR a.appointmentId = :appointmentId)")
    Page<Payment> findPaymentsWithFilters(
            @Param("status") String status,
            @Param("method") String paymentMethod,
            @Param("appointmentId") Long appointmentId,
            Pageable pageable
    );
}


