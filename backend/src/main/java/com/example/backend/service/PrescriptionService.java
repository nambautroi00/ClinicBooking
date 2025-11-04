package com.example.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.PrescriptionDto;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.PrescriptionMapper;
import com.example.backend.model.MedicalRecord;
import com.example.backend.model.Medicine;
import com.example.backend.model.Prescription;
import com.example.backend.model.PrescriptionItem;
import com.example.backend.repository.MedicalRecordRepository;
import com.example.backend.repository.MedicineRepository;
import com.example.backend.repository.PrescriptionItemRepository;
import com.example.backend.repository.PrescriptionRepository;

@Service
@Transactional
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;
    
    @Autowired
    private PrescriptionItemRepository prescriptionItemRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private MedicalRecordService medicalRecordService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private PrescriptionMapper prescriptionMapper;

    public List<PrescriptionDto> getAllPrescriptions() {
        return prescriptionRepository.findAllWithDetails().stream()
                .map(prescriptionMapper::toDto)
                .collect(Collectors.toList());
    }

    public Page<PrescriptionDto> getAllPrescriptions(Pageable pageable) {
        return prescriptionRepository.findAll(pageable)
                .map(prescriptionMapper::toDto);
    }

    public PrescriptionDto getPrescriptionById(Integer id) {
        try {
            System.out.println("🔍 Getting prescription by ID: " + id);
            
            // Try to load with details first
            Prescription prescription = prescriptionRepository.findByIdWithDetails(id)
                    .orElse(null);
            
            // If not found with details, try regular findById
            if (prescription == null) {
                System.out.println("⚠️ Not found with details, trying regular findById...");
                prescription = prescriptionRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("Prescription not found with id: " + id));
                
                // Load items separately
                System.out.println("🔍 Loading items for prescription " + id + "...");
                List<PrescriptionItem> items = prescriptionItemRepository.findByPrescriptionPrescriptionId(id);
                System.out.println("📦 Items from repository: " + (items != null ? items.size() : 0));
                if (items != null && !items.isEmpty()) {
                    items.forEach(item -> {
                        System.out.println("  - Item ID: " + item.getItemId() + 
                                         ", Medicine: " + (item.getMedicine() != null ? item.getMedicine().getName() : "null"));
                    });
                }
                prescription.setItems(items != null ? items : new ArrayList<>());
                System.out.println("✅ Loaded " + (items != null ? items.size() : 0) + " items separately");
            } else {
                // Ensure items are not null
                if (prescription.getItems() == null) {
                    System.out.println("⚠️ Items is null, setting empty list");
                    prescription.setItems(new ArrayList<>());
                } else {
                    System.out.println("📦 Items from JOIN FETCH: " + prescription.getItems().size());
                    if (!prescription.getItems().isEmpty()) {
                        prescription.getItems().forEach(item -> {
                            System.out.println("  - Item ID: " + item.getItemId() + 
                                             ", Medicine: " + (item.getMedicine() != null ? item.getMedicine().getName() : "null"));
                        });
                    }
                }
                System.out.println("✅ Loaded with details, has " + prescription.getItems().size() + " items");
            }
            
            return prescriptionMapper.toDto(prescription);
        } catch (Exception e) {
            System.err.println("❌ Error getting prescription by ID: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get prescription: " + e.getMessage(), e);
        }
    }

    public List<PrescriptionDto> getPrescriptionsByRecordId(Integer recordId) {
        return prescriptionRepository.findByMedicalRecordRecordId(recordId).stream()
                .map(prescriptionMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<PrescriptionDto> getPrescriptionsByDoctor(Long doctorId) {
        try {
            System.out.println("🔍 Getting prescriptions for doctorId: " + doctorId);
            List<Prescription> prescriptions = prescriptionRepository.findByDoctorId(doctorId);
            System.out.println("📊 Found " + prescriptions.size() + " prescriptions");
            
            // Check items loaded from JOIN FETCH
            for (Prescription p : prescriptions) {
                try {
                    Integer prescriptionId = p.getPrescriptionId();
                    if (prescriptionId == null) {
                        System.err.println("⚠️ Prescription has null ID");
                        if (p.getItems() == null) {
                            p.setItems(new ArrayList<>());
                        }
                        continue;
                    }
                    
                    // Items should already be loaded by JOIN FETCH, but ensure they're not null
                    if (p.getItems() == null) {
                        System.out.println("⚠️ Prescription " + prescriptionId + " has null items, loading separately");
                        List<PrescriptionItem> items = prescriptionItemRepository.findByPrescriptionPrescriptionId(prescriptionId);
                        p.setItems(items != null ? items : new ArrayList<>());
                    }
                    
                    int itemsCount = p.getItems() != null ? p.getItems().size() : 0;
                    System.out.println("🔍 Prescription " + prescriptionId + " has " + itemsCount + " items");
                    
                    if (itemsCount > 0) {
                        p.getItems().forEach(item -> {
                            System.out.println("  - Item: " + item.getItemId() + 
                                ", Medicine: " + (item.getMedicine() != null ? item.getMedicine().getName() : "null"));
                        });
                    }
                } catch (Exception e) {
                    System.err.println("❌ Error processing prescription " + p.getPrescriptionId() + ": " + e.getMessage());
                    e.printStackTrace();
                    // Set empty list on error to prevent null pointer
                    if (p.getItems() == null) {
                        p.setItems(new ArrayList<>());
                    }
                }
            }
            
            List<PrescriptionDto> dtos = prescriptions.stream()
                    .map(prescriptionMapper::toDto)
                    .collect(Collectors.toList());
            
            System.out.println("✅ Mapped to " + dtos.size() + " DTOs");
            if (!dtos.isEmpty()) {
                PrescriptionDto firstDto = dtos.get(0);
                System.out.println("📋 First prescription: " + firstDto.getPrescriptionId() + 
                                 ", Patient: " + firstDto.getPatientName() +
                                 ", Items count: " + (firstDto.getItems() != null ? firstDto.getItems().size() : 0));
            }
            
            return dtos;
        } catch (Exception e) {
            System.err.println("❌ Fatal error in getPrescriptionsByDoctor: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get prescriptions for doctor: " + e.getMessage(), e);
        }
    }

    public PrescriptionDto createPrescription(PrescriptionDto requestDto) {
        try {
            // Log incoming request for debugging
            System.out.println("🔍 Creating prescription with data: " + requestDto);
            System.out.println("🔍 RecordId: " + requestDto.getRecordId());
            System.out.println("🔍 AppointmentId: " + requestDto.getAppointmentId());
            System.out.println("🔍 Items count: " + (requestDto.getItems() != null ? requestDto.getItems().size() : 0));
            
            // Ensure medical record exists. If recordId is not provided, attempt to create one from appointmentId
            MedicalRecord medicalRecord = null;
            if (requestDto.getRecordId() == null) {
                Long appointmentId = requestDto.getAppointmentId();
                if (appointmentId == null) {
                    throw new IllegalArgumentException("Medical record id or appointmentId is required to create a prescription");
                }

                // Try to find existing medical record for this appointment
                var existing = medicalRecordRepository.findByAppointmentAppointmentId(appointmentId);
                if (existing != null && !existing.isEmpty()) {
                    medicalRecord = existing.get(0);
                    requestDto.setRecordId(Long.valueOf(medicalRecord.getRecordId()));
                } else {
                    // Create a minimal MedicalRecord using MedicalRecordService (it will validate appointment exists)
                    com.example.backend.dto.MedicalRecordDto mrDto = new com.example.backend.dto.MedicalRecordDto(appointmentId, requestDto.getNotes(), "");
                    var createdMr = medicalRecordService.createMedicalRecord(mrDto);
                    requestDto.setRecordId(createdMr.getRecordId().longValue());
                    // Reload the entity from repository
                    medicalRecord = medicalRecordRepository.findById(createdMr.getRecordId())
                            .orElseThrow(() -> new NotFoundException("Medical Record created but not found with id: " + createdMr.getRecordId()));
                }
            } else {
                // Validate medical record exists
                medicalRecord = medicalRecordRepository.findById(requestDto.getRecordId().intValue())
                        .orElseThrow(() -> new NotFoundException("Medical Record not found with id: " + requestDto.getRecordId()));
            }

            // Check if this medical record already has a prescription (OneToOne relationship)
            // If it does, update the existing prescription instead of creating a new one
            // Use repository query to check for existing prescription (more reliable than lazy loading)
            final Integer recordId = medicalRecord.getRecordId();
            System.out.println("🔍 Checking for existing prescription with recordId: " + recordId);
            
            List<Prescription> existingPrescriptions = prescriptionRepository.findByMedicalRecordRecordId(recordId);
            Prescription prescription;
            
            if (existingPrescriptions != null && !existingPrescriptions.isEmpty()) {
                prescription = existingPrescriptions.get(0);
                System.out.println("🔍 Found existing prescription with ID: " + prescription.getPrescriptionId());
                // Update existing prescription
                prescriptionMapper.updateEntity(prescription, requestDto);
                
                // Clear old prescription items (cascade + orphanRemoval will handle deletion)
                // This is more efficient than manually deleting via repository
                if (prescription.getItems() != null) {
                    prescription.getItems().clear();
                } else {
                    prescription.setItems(new ArrayList<>());
                }
                
                // Create new prescription items
                if (requestDto.getItems() != null && !requestDto.getItems().isEmpty()) {
                    List<PrescriptionItem> items = new ArrayList<>();
                    for (var itemDto : requestDto.getItems()) {
                        Medicine medicine = medicineRepository.findById(itemDto.getMedicineId().intValue())
                                .orElseThrow(() -> new NotFoundException("Medicine not found with id: " + itemDto.getMedicineId()));

                        PrescriptionItem item = new PrescriptionItem();
                        item.setPrescription(prescription);
                        item.setMedicine(medicine);
                        item.setDosage(itemDto.getDosage());
                        item.setDuration(itemDto.getDuration());
                        item.setNote(itemDto.getNote());
                        Integer quantity = itemDto.getQuantity();
                        item.setQuantity(quantity != null ? quantity : 1);
                        items.add(item);
                    }
                    prescription.setItems(items);
                } else {
                    // If no items provided, keep empty list
                    prescription.setItems(new ArrayList<>());
                }
            } else {
                // Create new prescription
                prescription = prescriptionMapper.toEntity(requestDto);
                prescription.setMedicalRecord(medicalRecord);
                
                // Ensure createdAt is set (should be set by mapper, but double-check)
                if (prescription.getCreatedAt() == null) {
                    prescription.setCreatedAt(java.time.LocalDateTime.now());
                }

                // Create prescription items
                List<PrescriptionItem> items = new ArrayList<>();
                if (requestDto.getItems() != null && !requestDto.getItems().isEmpty()) {
                    for (var itemDto : requestDto.getItems()) {
                        Medicine medicine = medicineRepository.findById(itemDto.getMedicineId().intValue())
                                .orElseThrow(() -> new NotFoundException("Medicine not found with id: " + itemDto.getMedicineId()));

                        PrescriptionItem item = new PrescriptionItem();
                        item.setPrescription(prescription);
                        item.setMedicine(medicine);
                        item.setDosage(itemDto.getDosage());
                        item.setDuration(itemDto.getDuration());
                        item.setNote(itemDto.getNote());
                        Integer quantity = itemDto.getQuantity();
                        item.setQuantity(quantity != null ? quantity : 1);
                        items.add(item);
                    }
                }
                prescription.setItems(items);
            }

            Prescription savedPrescription = prescriptionRepository.save(prescription);
            System.out.println("✅ Prescription saved successfully with ID: " + savedPrescription.getPrescriptionId());
            
            // Verify items were saved
            if (savedPrescription.getItems() != null) {
                System.out.println("📦 Saved prescription has " + savedPrescription.getItems().size() + " items in memory");
            } else {
                System.out.println("⚠️ Saved prescription has null items");
            }
            
            // Reload from database to verify persistence
            Prescription reloaded = prescriptionRepository.findById(savedPrescription.getPrescriptionId()).orElse(null);
            if (reloaded != null) {
                List<PrescriptionItem> dbItems = prescriptionItemRepository.findByPrescriptionPrescriptionId(savedPrescription.getPrescriptionId());
                System.out.println("🔍 Reloaded from DB: " + dbItems.size() + " items found");
                if (!dbItems.isEmpty()) {
                    dbItems.forEach(item -> {
                        System.out.println("  ✅ Item " + item.getItemId() + ": " + 
                                         (item.getMedicine() != null ? item.getMedicine().getName() : "null"));
                    });
                }
            }
            
            return prescriptionMapper.toDto(savedPrescription);
        } catch (Exception e) {
            System.err.println("❌ Error creating prescription: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create prescription: " + e.getMessage(), e);
        }
    }

    public PrescriptionDto updatePrescription(Integer id, PrescriptionDto requestDto) {
        Prescription existingPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Prescription not found with id: " + id));

        // Update basic fields (notes)
        prescriptionMapper.updateEntity(existingPrescription, requestDto);

        // Update medical record diagnosis if notes is provided (sync notes with diagnosis)
        if (requestDto.getNotes() != null && existingPrescription.getMedicalRecord() != null) {
            MedicalRecord medicalRecord = existingPrescription.getMedicalRecord();
            medicalRecord.setDiagnosis(requestDto.getNotes());
            medicalRecordRepository.save(medicalRecord);
        }

        // Update medical record if changed
        if (requestDto.getRecordId() != null && 
            !requestDto.getRecordId().equals(Long.valueOf(existingPrescription.getMedicalRecord().getRecordId()))) {
            MedicalRecord medicalRecord = medicalRecordRepository.findById(requestDto.getRecordId().intValue())
                    .orElseThrow(() -> new NotFoundException("Medical Record not found with id: " + requestDto.getRecordId()));
            existingPrescription.setMedicalRecord(medicalRecord);
        }

        // Update prescription items only if items are provided and not empty (don't recreate if not needed)
        // If items is null or empty, keep existing items unchanged
        if (requestDto.getItems() != null && !requestDto.getItems().isEmpty()) {
            existingPrescription.getItems().clear();
            List<PrescriptionItem> newItems = new ArrayList<>();
            for (var itemDto : requestDto.getItems()) {
                Medicine medicine = medicineRepository.findById(itemDto.getMedicineId().intValue())
                        .orElseThrow(() -> new NotFoundException("Medicine not found with id: " + itemDto.getMedicineId()));

                PrescriptionItem item = new PrescriptionItem();
                item.setPrescription(existingPrescription);
                item.setMedicine(medicine);
                item.setDosage(itemDto.getDosage());
                item.setDuration(itemDto.getDuration());
                item.setNote(itemDto.getNote());
                // Set quantity if provided, otherwise default to 1
                item.setQuantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1);
                newItems.add(item);
            }
            existingPrescription.setItems(newItems);
        }

        Prescription updatedPrescription = prescriptionRepository.save(existingPrescription);
        return prescriptionMapper.toDto(updatedPrescription);
    }

    public void deletePrescription(Integer id) {
        if (!prescriptionRepository.existsById(id)) {
            throw new NotFoundException("Prescription not found with id: " + id);
        }
        prescriptionRepository.deleteById(id);
    }
}