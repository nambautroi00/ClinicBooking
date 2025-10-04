package com.example.backend.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

import com.example.backend.constant.AppConstants;
import com.example.backend.dto.PaymentDTO;
import com.example.backend.service.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<Page<PaymentDTO.ResponseDTO>> getAllPayments(
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = AppConstants.DEFAULT_SORT_FIELD) Pageable pageable) {
        Page<PaymentDTO.ResponseDTO> payments = paymentService.getAllPayments(pageable);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDTO.ResponseDTO> getPaymentById(@PathVariable Long id) {
        PaymentDTO.ResponseDTO payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PaymentDTO.ResponseDTO>> searchPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false, name = "method") String paymentMethod,
            @RequestParam(required = false) Long appointmentId,
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = AppConstants.DEFAULT_SORT_FIELD) Pageable pageable) {
        Page<PaymentDTO.ResponseDTO> payments = paymentService.searchPayments(status, paymentMethod, appointmentId, pageable);
        return ResponseEntity.ok(payments);
    }

    @PostMapping
    public ResponseEntity<PaymentDTO.ResponseDTO> createPayment(@Valid @RequestBody PaymentDTO.Create createDTO) {
        PaymentDTO.ResponseDTO created = paymentService.createPayment(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentDTO.ResponseDTO> updatePayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentDTO.Update updateDTO) {
        PaymentDTO.ResponseDTO updated = paymentService.updatePayment(id, updateDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }
}


