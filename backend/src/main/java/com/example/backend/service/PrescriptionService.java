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
import com.example.backend.repository.PrescriptionRepository;

@Service
@Transactional
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private PrescriptionMapper prescriptionMapper;

    public List<PrescriptionDto> getAllPrescriptions() {
        return prescriptionRepository.findAll().stream()
                .map(prescriptionMapper::toDto)
                .collect(Collectors.toList());
    }

    public Page<PrescriptionDto> getAllPrescriptions(Pageable pageable) {
        return prescriptionRepository.findAll(pageable)
                .map(prescriptionMapper::toDto);
    }

    public PrescriptionDto getPrescriptionById(Integer id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Prescription not found with id: " + id));
        return prescriptionMapper.toDto(prescription);
    }

    public List<PrescriptionDto> getPrescriptionsByRecordId(Integer recordId) {
        return prescriptionRepository.findByMedicalRecordRecordId(recordId).stream()
                .map(prescriptionMapper::toDto)
                .collect(Collectors.toList());
    }

    public PrescriptionDto createPrescription(PrescriptionDto requestDto) {
        // Validate medical record exists
        MedicalRecord medicalRecord = medicalRecordRepository.findById(requestDto.getRecordId().intValue())
                .orElseThrow(() -> new NotFoundException("Medical Record not found with id: " + requestDto.getRecordId()));

        Prescription prescription = prescriptionMapper.toEntity(requestDto);
        prescription.setMedicalRecord(medicalRecord);

        // Create prescription items
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
                items.add(item);
            }
            prescription.setItems(items);
        }

        Prescription savedPrescription = prescriptionRepository.save(prescription);
        return prescriptionMapper.toDto(savedPrescription);
    }

    public PrescriptionDto updatePrescription(Integer id, PrescriptionDto requestDto) {
        Prescription existingPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Prescription not found with id: " + id));

        // Update basic fields
        prescriptionMapper.updateEntity(existingPrescription, requestDto);

        // Update medical record if changed
        if (requestDto.getRecordId() != null && 
            !requestDto.getRecordId().equals(Long.valueOf(existingPrescription.getMedicalRecord().getRecordId()))) {
            MedicalRecord medicalRecord = medicalRecordRepository.findById(requestDto.getRecordId().intValue())
                    .orElseThrow(() -> new NotFoundException("Medical Record not found with id: " + requestDto.getRecordId()));
            existingPrescription.setMedicalRecord(medicalRecord);
        }

        // Update prescription items
        if (requestDto.getItems() != null) {
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