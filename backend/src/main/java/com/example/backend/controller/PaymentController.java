package com.example.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;              // <-- thêm
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;   // <-- thêm (RestController, RequestMapping, etc.)
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.PaymentDTO;
import com.example.backend.model.Payment;
import com.example.backend.service.PaymentService;
import com.example.backend.service.PdfExportService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PaymentController {
    
    private final PaymentService paymentService;
    private final PdfExportService pdfExportService;

    @PostMapping
    public ResponseEntity<PaymentDTO.Response> createPayment(@Valid @RequestBody PaymentDTO.Create paymentCreateDTO) {
        try {
            log.info("🔍 Creating payment with data: {}", paymentCreateDTO);
            PaymentDTO.Response payment = paymentService.createPayment(paymentCreateDTO);
            log.info("✅ Payment created successfully: {}", payment.getPaymentId());
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (Exception e) {
            log.error("❌ Error creating payment: ", e);
            PaymentDTO.Response errorResponse = new PaymentDTO.Response();
            errorResponse.setPaymentId(null);
            errorResponse.setAppointmentId(paymentCreateDTO.getAppointmentId());
            errorResponse.setStatus(Payment.PaymentStatus.FAILED);
            errorResponse.setDescription("Error: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentDTO.Response> getPaymentById(@PathVariable Long paymentId) {
        try {
            PaymentDTO.Response payment = paymentService.getPaymentById(paymentId);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            log.error("Error getting payment by ID: ", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    @GetMapping("/payos/{payOSPaymentId}")
    public ResponseEntity<PaymentDTO.Response> getPaymentByPayOSPaymentId(@PathVariable String payOSPaymentId) {
        try {
            PaymentDTO.Response payment = paymentService.getPaymentByPayOSPaymentId(payOSPaymentId);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            log.error("Error getting payment by PayOS Payment ID: ", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<PaymentDTO.Response>> getPaymentsByAppointmentId(@PathVariable Long appointmentId) {
        try {
            List<PaymentDTO.Response> payments = paymentService.getPaymentsByAppointmentId(appointmentId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error getting payments by appointment ID: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PaymentDTO.Response>> getPaymentsByPatientId(@PathVariable Long patientId) {
        try {
            List<PaymentDTO.Response> payments = paymentService.getPaymentsByPatientId(patientId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error getting payments by patient ID: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<PaymentDTO.Response>> getPaymentsByDoctorId(@PathVariable Long doctorId) {
        try {
            List<PaymentDTO.Response> payments = paymentService.getPaymentsByDoctorId(doctorId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error getting payments by doctor ID: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping
    public ResponseEntity<Page<PaymentDTO.Response>> getAllPayments(Pageable pageable) {
        try {
            Page<PaymentDTO.Response> payments = paymentService.getAllPayments(pageable);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error getting all payments: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PaymentDTO.Response>> getPaymentsByStatus(@PathVariable Payment.PaymentStatus status) {
        try {
            List<PaymentDTO.Response> payments = paymentService.getPaymentsByStatus(status);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error getting payments by status: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{paymentId}/status")
    public ResponseEntity<PaymentDTO.Response> updatePaymentStatus(
            @PathVariable Long paymentId, 
            @RequestParam Payment.PaymentStatus status) {
        try {
            PaymentDTO.Response payment = paymentService.updatePaymentStatus(paymentId, status);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            log.error("Error updating payment status: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @DeleteMapping("/{paymentId}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long paymentId) {
        try {
            paymentService.deletePayment(paymentId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting payment: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    
    @GetMapping("/{paymentId}/status")
    public ResponseEntity<PaymentDTO.Response> checkPaymentStatus(@PathVariable Long paymentId) {
        try {
            PaymentDTO.Response payment = paymentService.getPaymentById(paymentId);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            log.error("Error checking payment status: ", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/payos/{payOSPaymentId}/status")
    public ResponseEntity<PaymentDTO.Response> updatePaymentStatusFromPayOS(
            @PathVariable String payOSPaymentId,
            @RequestParam String status,
            @RequestParam(required = false) String orderCode) {
        try {
            log.info("🔍 Updating payment status from PayOS: payOSId={}, status={}, orderCode={}", 
                payOSPaymentId, status, orderCode);
            
            PaymentDTO.Response payment = paymentService.updatePaymentStatusFromPayOS(
                payOSPaymentId, status, orderCode);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            log.error("Error updating payment status from PayOS: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/invoice-pdf")
    public ResponseEntity<byte[]> exportInvoicePdf(@PathVariable Long id) {
        List<String> lines = new ArrayList<>();
        lines.add("Mã hóa đơn: INV-" + id);
        lines.add("Ngày: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        lines.add("Bệnh nhân: [Tên bệnh nhân]");
        lines.add("Bác sĩ: [Tên bác sĩ]");
        lines.add("Phương thức thanh toán: [Tiền mặt/Thẻ/PayOS]");
        lines.add("--------------------------------");
        lines.add("Dịch vụ: [Tên dịch vụ] - [Thành tiền]");
        lines.add("Thuốc: [Tổng tiền thuốc]");
        lines.add("Giảm giá: [Nếu có]");
        lines.add("--------------------------------");
        lines.add("Tổng cộng: " + new BigDecimal("0.00") + " VND");
        lines.add("Trạng thái: [Đã thanh toán/Chờ thanh toán]");

        byte[] pdf = pdfExportService.generateSimplePdf("HÓA ĐƠN THANH TOÁN", lines);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
