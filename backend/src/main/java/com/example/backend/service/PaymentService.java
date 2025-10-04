package com.example.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.PaymentDTO;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.PaymentMapper;
import com.example.backend.model.Appointment;
import com.example.backend.model.Payment;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final PaymentMapper paymentMapper;

    @Transactional(readOnly = true)
    public Page<PaymentDTO.ResponseDTO> getAllPayments(Pageable pageable) {
        return paymentRepository.findAll(pageable)
                .map(paymentMapper::entityToResponseDTO);
    }

    @Transactional(readOnly = true)
    public PaymentDTO.ResponseDTO getPaymentById(Long id) {
        Payment payment = findPaymentById(id);
        return paymentMapper.entityToResponseDTO(payment);
    }

    @Transactional(readOnly = true)
    public Page<PaymentDTO.ResponseDTO> searchPayments(String status, String method, Long appointmentId, Pageable pageable) {
        return paymentRepository.findPaymentsWithFilters(status, method, appointmentId, pageable)
                .map(paymentMapper::entityToResponseDTO);
    }

    public PaymentDTO.ResponseDTO createPayment(PaymentDTO.Create createDTO) {
        Appointment appointment = appointmentRepository.findById(createDTO.getAppointmentId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + createDTO.getAppointmentId()));

        Payment payment = paymentMapper.createDTOToEntity(createDTO, appointment);
        Payment saved = paymentRepository.save(payment);
        return paymentMapper.entityToResponseDTO(saved);
    }

    public PaymentDTO.ResponseDTO updatePayment(Long id, PaymentDTO.Update updateDTO) {
        Payment payment = findPaymentById(id);

        if (updateDTO.getPaymentMethod() != null) {
            payment.setPaymentMethod(updateDTO.getPaymentMethod());
        }
        if (updateDTO.getPaymentStatus() != null) {
            payment.setPaymentStatus(updateDTO.getPaymentStatus());
        }
        if (updateDTO.getPaidAt() != null) {
            payment.setPaidAt(updateDTO.getPaidAt());
        }
        if (updateDTO.getNotes() != null) {
            payment.setNotes(updateDTO.getNotes());
        }

        Payment updated = paymentRepository.save(payment);
        return paymentMapper.entityToResponseDTO(updated);
    }

    public void deletePayment(Long id) {
        // Hard delete cho Payment (không có cờ status soft delete ở model)
        if (!paymentRepository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy thanh toán với ID: " + id);
        }
        paymentRepository.deleteById(id);
    }

    private Payment findPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thanh toán với ID: " + id));
    }
}


