
package com.example.backend.service;


import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final EmailService emailService;

    public Payment createPayment(String orderId, Long appointmentId, java.math.BigDecimal amount, String description) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));
        Payment payment = new Payment();
        payment.setOrderId(orderId);
        payment.setAppointment(appointment);
        payment.setAmount(amount);
        payment.setDescription(description);
        payment.setStatus("Pending");
        payment.setCreatedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment updatePaymentStatus(String orderId, String transactionId, boolean success) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + orderId));

        if (success) {
            payment.setStatus("Paid");
            payment.setTransactionId(transactionId);
            payment.setPaidAt(LocalDateTime.now());

            Appointment appointment = payment.getAppointment();
            if (appointment != null) {
                appointment.setStatus("Paid");
                appointmentRepository.save(appointment);
                // send receipt/confirmation to patient
                try {
                    String patientEmail = appointment.getPatient() != null && appointment.getPatient().getUser() != null
                            ? appointment.getPatient().getUser().getEmail()
                            : null;
                    String subject = "Xác nhận thanh toán";
                    String body = String.format("Thanh toán cho lịch khám (ID: %s) đã thành công. Mã giao dịch: %s", appointment.getAppointmentId(), transactionId);
                    emailService.sendSimpleEmail(patientEmail, subject, body);
                } catch (Exception ex) {
                    // ignore email failures
                }
            }
        } else {
            payment.setStatus("Failed");
        }

        payment.setUpdatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }
   
    public String generateQrUrl(String description, java.math.BigDecimal amount) {
        String addInfo = java.net.URLEncoder.encode(description, java.nio.charset.StandardCharsets.UTF_8);
        return "https://img.vietqr.io/image/MB-1021072004-compact.png?amount="
                + amount.longValue() + "&addInfo=" + addInfo;
    }
    public java.util.List<Payment> getPaymentsByPatientId(Long patientId) {
        // Lấy tất cả payment theo patientId qua appointment
        return paymentRepository.findAll().stream()
            .filter(p -> p.getAppointment() != null &&
                p.getAppointment().getPatient() != null &&
                patientId.equals(p.getAppointment().getPatient().getPatientId()))
            .toList();
    }
}


