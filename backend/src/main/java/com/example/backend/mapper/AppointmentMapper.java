package com.example.backend.mapper;

import org.springframework.stereotype.Component;

import com.example.backend.dto.AppointmentDTO;
import com.example.backend.model.Appointment;
import com.example.backend.model.Doctor;
import com.example.backend.model.DoctorSchedule;
import com.example.backend.model.Patient;

@Component
public class AppointmentMapper {

    public Appointment createDTOToEntity(AppointmentDTO.Create dto, Patient patient, Doctor doctor, DoctorSchedule schedule) {
    Appointment entity = new Appointment();
    entity.setPatient(patient);
    entity.setDoctor(doctor);
    entity.setSchedule(schedule);
    entity.setStartTime(dto.getStartTime());
    entity.setEndTime(dto.getEndTime());
    entity.setNotes(dto.getNotes());
    entity.setFee(dto.getFee());
    return entity;
    }

    public void applyUpdateToEntity(Appointment entity, AppointmentDTO.Update dto) {
        if (dto.getStartTime() != null) {
            entity.setStartTime(dto.getStartTime());
        }
        if (dto.getEndTime() != null) {
            entity.setEndTime(dto.getEndTime());
        }
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }
        if (dto.getNotes() != null) {
            entity.setNotes(dto.getNotes());
        }
        if (dto.getFee() != null) {
            entity.setFee(dto.getFee());
        }
    }

    public AppointmentDTO.Response entityToResponseDTO(Appointment entity) {
        AppointmentDTO.Response dto = new AppointmentDTO.Response();
    dto.setAppointmentId(entity.getAppointmentId().longValue());
    dto.setPatientId(entity.getPatient() != null ? entity.getPatient().getPatientId().longValue() : null);
    dto.setPatientName(entity.getPatient() != null && entity.getPatient().getUser() != null
        ? entity.getPatient().getUser().getFirstName() + " " + entity.getPatient().getUser().getLastName()
        : null);
    dto.setDoctorId(entity.getDoctor() != null ? entity.getDoctor().getDoctorId() : null);
    dto.setDoctorName(entity.getDoctor() != null && entity.getDoctor().getUser() != null
        ? entity.getDoctor().getUser().getFirstName() + " " + entity.getDoctor().getUser().getLastName()
        : null);
    dto.setScheduleId(entity.getSchedule() != null ? entity.getSchedule().getScheduleId() : null);
    dto.setStartTime(entity.getStartTime());
    dto.setEndTime(entity.getEndTime());
    dto.setStatus(entity.getStatus());
    dto.setNotes(entity.getNotes());
    dto.setFee(entity.getFee());
    return dto;
    }
}


