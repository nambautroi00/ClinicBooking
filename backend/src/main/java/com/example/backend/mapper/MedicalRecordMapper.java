package com.example.backend.mapper;

import org.springframework.stereotype.Component;

import com.example.backend.dto.MedicalRecordDto;
import com.example.backend.model.MedicalRecord;

@Component
public class MedicalRecordMapper {

    public MedicalRecordDto toDto(MedicalRecord entity) {
        if (entity == null) {
            return null;
        }
        return new MedicalRecordDto(
            entity.getRecordId(),
            entity.getAppointment() != null ? entity.getAppointment().getAppointmentId() : null,
            entity.getDiagnosis(),
            entity.getAdvice(),
            entity.getCreatedAt()
        );
    }

    public MedicalRecord toEntity(MedicalRecordDto dto) {
        if (dto == null) {
            return null;
        }
        MedicalRecord entity = new MedicalRecord();
        // Note: appointment will be set in service layer
        entity.setDiagnosis(dto.getDiagnosis());
        entity.setAdvice(dto.getAdvice());
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