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
        
        // Map patient and doctor information from Appointment
        if (entity.getAppointment() != null) {
            var appointment = entity.getAppointment();
            
            // Map patient info
            if (appointment.getPatient() != null) {
                dto.setPatientId((long) appointment.getPatient().getPatientId());
                
                if (appointment.getPatient().getUser() != null) {
                    String lastName = appointment.getPatient().getUser().getLastName() != null 
                        ? appointment.getPatient().getUser().getLastName() : "";
                    String firstName = appointment.getPatient().getUser().getFirstName() != null 
                        ? appointment.getPatient().getUser().getFirstName() : "";
                    dto.setPatientName((lastName + " " + firstName).trim());
                    dto.setPatientPhone(appointment.getPatient().getUser().getPhone());
                }
            }
            
            // Map doctor info
            if (appointment.getDoctor() != null) {
                dto.setDoctorId((long) appointment.getDoctor().getDoctorId());
                
                if (appointment.getDoctor().getUser() != null) {
                    String lastName = appointment.getDoctor().getUser().getLastName() != null 
                        ? appointment.getDoctor().getUser().getLastName() : "";
                    String firstName = appointment.getDoctor().getUser().getFirstName() != null 
                        ? appointment.getDoctor().getUser().getFirstName() : "";
                    dto.setDoctorName((lastName + " " + firstName).trim());
                }
            }
            
            // Map appointment date
            dto.setAppointmentDate(appointment.getStartTime());
        }
        
        // Map prescription - need to initialize items collection if lazy loaded
        if (entity.getPrescription() != null) {
            System.out.println("🔍 Mapping prescription for MedicalRecord " + entity.getRecordId());
            
            // Force initialization of items collection if lazy loaded
            var prescription = entity.getPrescription();
            if (prescription.getItems() != null) {
                try {
                    int itemsSize = prescription.getItems().size(); // This will trigger lazy loading
                    System.out.println("📋 Prescription items count: " + itemsSize);
                } catch (Exception e) {
                    System.out.println("⚠️ Could not access items collection: " + e.getMessage());
                }
            } else {
                System.out.println("⚠️ Prescription items is null");
            }
            
            var prescriptionDto = prescriptionMapper.toDto(prescription);
            dto.setPrescription(prescriptionDto);
            
            System.out.println("✅ Mapped prescription with " + 
                (prescriptionDto.getItems() != null ? prescriptionDto.getItems().size() : 0) + " items");
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