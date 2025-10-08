package com.example.backend.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.example.backend.dto.PaymentDTO;
import com.example.backend.model.Payment;
import com.example.backend.service.PaymentService;
import com.example.backend.mapper.PaymentMapper;
import com.example.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentMapper paymentMapper;
    private final AppointmentRepository appointmentRepository;


    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> payload) {
        Long appointmentId = Long.valueOf(payload.get("appointmentId").toString());
        java.math.BigDecimal amount = new java.math.BigDecimal(payload.get("amount").toString());
        if (amount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than 0"));
        }
        if (!appointmentRepository.existsById(appointmentId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Appointment does not exist"));
        }
        // Backend sinh orderId
        String orderId = "APPT-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String description = "Thanh toan lich kham #" + orderId;

        Payment payment = paymentService.createPayment(orderId, appointmentId, amount, description);
        String qrUrl = paymentService.generateQrUrl(description, amount);
        PaymentDTO.ResponseDTO paymentDTO = paymentMapper.entityToResponseDTO(payment);

        return ResponseEntity.ok(Map.of(
                "payment", paymentDTO,
                "qrUrl", qrUrl
        ));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody Map<String, Object> payload) {
        String orderId = (String) payload.get("orderId");
        String transactionId = (String) payload.get("transactionId");
        boolean success = "SUCCESS".equals(payload.get("status"));

        Payment updated = paymentService.updatePaymentStatus(orderId, transactionId, success);
        PaymentDTO.ResponseDTO paymentDTO = paymentMapper.entityToResponseDTO(updated);

        return ResponseEntity.ok(Map.of("status", "updated", "payment", paymentDTO));
    }

    // API tra cứu lịch sử thanh toán theo patientId
    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistoryByPatient(@RequestParam Long patientId) {
        var payments = paymentService.getPaymentsByPatientId(patientId);
        var dtos = payments.stream().map(paymentMapper::entityToResponseDTO).toList();
        return ResponseEntity.ok(dtos);
    }
}


