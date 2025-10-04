package com.example.backend.mapper;

import org.springframework.stereotype.Component;

import com.example.backend.dto.PaymentDTO;
import com.example.backend.model.Appointment;
import com.example.backend.model.Payment;

@Component
public class PaymentMapper {

    public Payment createDTOToEntity(PaymentDTO.Create dto, Appointment appointment) {
        Payment payment = new Payment();
        payment.setAppointment(appointment);
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setPaymentStatus("Pending");
        payment.setNotes(dto.getNotes());
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
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setPaymentStatus(payment.getPaymentStatus());
        dto.setPaidAt(payment.getPaidAt());
        dto.setNotes(payment.getNotes());
        return dto;
    }
}


