package com.example.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.AppointmentDTO;
import com.example.backend.service.AppointmentService;
import com.example.backend.service.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody AppointmentDTO.Create dto) {
        AppointmentDTO.Response created = appointmentService.create(dto);
        // Sau khi tạo appointment, tạo luôn payment và trả về qrUrl
        Long appointmentId = created.getAppointmentId();
        java.math.BigDecimal amount = created.getFee();
        // Sinh orderId
        String orderId = "APPT-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String description = "Thanh toan lich kham #" + orderId;
    com.example.backend.model.Payment payment = null;
    String qrUrl = null;
    if (appointmentId != null && amount != null) {
        payment = paymentService.createPayment(orderId, appointmentId, amount, description);
        qrUrl = paymentService.generateQrUrl(description, amount);
    }
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(java.util.Map.of(
            "appointment", created,
            "paymentId", payment != null ? payment.getPaymentId() : null,
            "orderId", payment != null ? payment.getOrderId() : null,
            "qrUrl", qrUrl
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO.Response> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    @GetMapping("/by-patient")
    public ResponseEntity<List<AppointmentDTO.Response>> getByPatient(@RequestParam("patientId") Long patientId) {
        return ResponseEntity.ok(appointmentService.getByPatient(patientId));
    }

    @GetMapping("/by-doctor")
    public ResponseEntity<List<AppointmentDTO.Response>> getByDoctor(@RequestParam("doctorId") Long doctorId) {
        return ResponseEntity.ok(appointmentService.getByDoctor(doctorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentDTO.Response> update(@PathVariable("id") Long id,
                                                          @Valid @RequestBody AppointmentDTO.Update dto) {
        return ResponseEntity.ok(appointmentService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AppointmentDTO.Response> delete(@PathVariable("id") Long id) {
        AppointmentDTO.Response updated = appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(updated);
    }
}


