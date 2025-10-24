package com.example.backend.mapper;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.backend.dto.MedicalRecordDto;
import com.example.backend.model.MedicalRecord;

@Component
public class MedicalRecordMapper {

    @Autowired
    private PrescriptionMapper prescriptionMapper;

    public MedicalRecordDto toDto(MedicalRecord entity) {
        if (entity == null) {
            return null;
        }
        MedicalRecordDto dto = new MedicalRecordDto(
            entity.getRecordId(),
            entity.getAppointment() != null ? entity.getAppointment().getAppointmentId() : null,
            entity.getDiagnosis(),
            entity.getAdvice(),
            entity.getCreatedAt()
        );
        if (entity.getPrescription() != null) {
            dto.setPrescription(prescriptionMapper.toDto(entity.getPrescription()));
        }
        return dto;
    }

    public MedicalRecord toEntity(MedicalRecordDto dto) {
        if (dto == null) {
            return null;
        }
        MedicalRecord entity = new MedicalRecord();
        // Note: appointment will be set in service layer
        entity.setDiagnosis(dto.getDiagnosis());
        entity.setAdvice(dto.getAdvice());
        entity.setCreatedAt(LocalDateTime.now());
        return entity;
    }

    public void updateEntity(MedicalRecord entity, MedicalRecordDto dto) {
        if (entity == null || dto == null) {
            return;
        }
        // Note: appointment will be updated in service layer if needed
        entity.setDiagnosis(dto.getDiagnosis());
        entity.setAdvice(dto.getAdvice());
    }
}