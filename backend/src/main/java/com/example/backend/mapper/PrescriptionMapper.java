package com.example.backend.mapper;

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.backend.dto.PrescriptionDto;
import com.example.backend.model.Prescription;

@Component
public class PrescriptionMapper {

    @Autowired
    private PrescriptionItemMapper prescriptionItemMapper;

    public PrescriptionDto toDto(Prescription entity) {
        if (entity == null) {
            return null;
        }
        
        PrescriptionDto dto = new PrescriptionDto();
        dto.setPrescriptionId(entity.getPrescriptionId() != null ? Long.valueOf(entity.getPrescriptionId()) : null);
        dto.setRecordId(entity.getMedicalRecord() != null ? Long.valueOf(entity.getMedicalRecord().getRecordId()) : null);
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        
        if (entity.getItems() != null) {
            dto.setItems(entity.getItems().stream()
                .map(prescriptionItemMapper::toDto)
                .collect(Collectors.toList()));
        }
        
        return dto;
    }

    public Prescription toEntity(PrescriptionDto dto) {
        if (dto == null) {
            return null;
        }
        
        Prescription entity = new Prescription();
        entity.setNotes(dto.getNotes());
        // Note: MedicalRecord will be set in the service layer
        return entity;
    }

    public void updateEntity(Prescription entity, PrescriptionDto dto) {
        if (entity == null || dto == null) {
            return;
        }
        entity.setNotes(dto.getNotes());
    }
}