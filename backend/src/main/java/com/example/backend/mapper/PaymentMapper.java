package com.example.backend.mapper;

import org.springframework.stereotype.Component;

import com.example.backend.dto.PaymentDTO;
import com.example.backend.model.Appointment;
import com.example.backend.model.Payment;

@Component
public class PaymentMapper {


    public Payment createDTOToEntity(PaymentDTO.Create dto, Appointment appointment, String orderId, java.math.BigDecimal amount) {
        Payment payment = new Payment();
        payment.setAppointment(appointment);
        payment.setOrderId(orderId);
        payment.setAmount(amount);
        payment.setStatus("Pending");
        payment.setCreatedAt(java.time.LocalDateTime.now());
        payment.setUpdatedAt(java.time.LocalDateTime.now());
        // Các trường transactionId, description, paidAt sẽ được cập nhật sau khi thanh toán Sepay thành công
        return payment;
    }

    public PaymentDTO.ResponseDTO entityToResponseDTO(Payment payment) {
        PaymentDTO.ResponseDTO dto = new PaymentDTO.ResponseDTO();
        dto.setPaymentId(payment.getPaymentId());
        if (payment.getAppointment() != null) {
            Long apptId = payment.getAppointment().getAppointmentId();
            dto.setAppointmentId(apptId != null ? apptId.longValue() : null);
        } else {
            dto.setAppointmentId(null);
        }
        dto.setOrderId(payment.getOrderId());
        dto.setAmount(payment.getAmount());
        dto.setStatus(payment.getStatus());
        dto.setTransactionId(payment.getTransactionId());
        dto.setDescription(payment.getDescription());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setPaidAt(payment.getPaidAt());
        dto.setUpdatedAt(payment.getUpdatedAt());
        return dto;
    }
}


