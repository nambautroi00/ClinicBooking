package com.example.backend.controller;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.PrescriptionDto;
import com.example.backend.service.PdfExportService;
import com.example.backend.service.PrescriptionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final PdfExportService pdfExportService;

    public PrescriptionController(
        PrescriptionService prescriptionService,
        PdfExportService pdfExportService
    ) {
        this.prescriptionService = prescriptionService;
        this.pdfExportService = pdfExportService;
    }

    @GetMapping
    public ResponseEntity<List<PrescriptionDto>> getAllPrescriptions() {
        List<PrescriptionDto> prescriptions = prescriptionService.getAllPrescriptions();
        return ResponseEntity.ok(prescriptions);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<PrescriptionDto>> getAllPrescriptionsPaged(Pageable pageable) {
        Page<PrescriptionDto> prescriptions = prescriptionService.getAllPrescriptions(pageable);
        return ResponseEntity.ok(prescriptions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionDto> getPrescriptionById(@PathVariable Integer id) {
        PrescriptionDto prescription = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(prescription);
    }

    @GetMapping("/record/{recordId}")
    public ResponseEntity<List<PrescriptionDto>> getPrescriptionsByRecordId(@PathVariable Integer recordId) {
        List<PrescriptionDto> prescriptions = prescriptionService.getPrescriptionsByRecordId(recordId);
        return ResponseEntity.ok(prescriptions);
    }

    @PostMapping
    public ResponseEntity<PrescriptionDto> createPrescription(@Valid @RequestBody PrescriptionDto requestDto) {
        PrescriptionDto createdPrescription = prescriptionService.createPrescription(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPrescription);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrescriptionDto> updatePrescription(@PathVariable Integer id, 
                                                            @Valid @RequestBody PrescriptionDto requestDto) {
        PrescriptionDto updatedPrescription = prescriptionService.updatePrescription(id, requestDto);
        return ResponseEntity.ok(updatedPrescription);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(@PathVariable Integer id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportPrescriptionPdf(@PathVariable Integer id) {
        List<String> lines = new ArrayList<>();
        lines.add("Mã đơn thuốc: #" + id);
        lines.add("Ngày lập: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        lines.add("Bệnh nhân: [Tên bệnh nhân]");
        lines.add("Bác sĩ: [Tên bác sĩ]");
        lines.add("Chẩn đoán: [Chẩn đoán]");
        lines.add("--------------------------------");
        lines.add("Thuốc 1 - Liều dùng - Số lượng");
        lines.add("Thuốc 2 - Liều dùng - Số lượng");
        lines.add("--------------------------------");
        lines.add("Lưu ý: [Ghi chú]");

        byte[] pdf = pdfExportService.generateSimplePdf("ĐƠN THUỐC", lines);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=prescription-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}