package com.example.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.AppointmentDTO;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.AppointmentMapper;
import com.example.backend.model.Appointment;
import com.example.backend.model.Doctor;
import com.example.backend.model.DoctorSchedule;
import com.example.backend.model.Patient;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.DoctorScheduleRepository;
import com.example.backend.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final AppointmentMapper appointmentMapper;

    public AppointmentDTO.Response create(AppointmentDTO.Create dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với ID: " + dto.getDoctorId()));
        DoctorSchedule schedule = null;
        if (dto.getScheduleId() != null) {
            schedule = doctorScheduleRepository.findById(dto.getScheduleId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lịch với ID: " + dto.getScheduleId()));
            // Prevent double booking for the exact slot
            if (schedule.getStatus() != null && !schedule.getStatus().equalsIgnoreCase("Available")) {
                throw new IllegalStateException("Khung giờ đã được đặt hoặc không khả dụng");
            }
        }

        Appointment entity = appointmentMapper.createDTOToEntity(dto, patient, doctor, schedule);
        Appointment saved = appointmentRepository.save(entity);
        // Mark schedule as booked when used
        if (schedule != null) {
            schedule.setStatus("Unavailable");
            doctorScheduleRepository.save(schedule);
        }

        return appointmentMapper.entityToResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public AppointmentDTO.Response getById(Long appointmentId) {
        Appointment entity = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId));
        return appointmentMapper.entityToResponseDTO(entity);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> getByPatient(Long patientId) {
        List<Appointment> list = appointmentRepository.findByPatient_PatientId(patientId);
        return list.stream().map(appointmentMapper::entityToResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> getByDoctor(Long doctorId) {
        List<Appointment> list = appointmentRepository.findByDoctor_DoctorId(doctorId);
        return list.stream().map(appointmentMapper::entityToResponseDTO).toList();
    }

    public AppointmentDTO.Response update(Long appointmentId, AppointmentDTO.Update dto) {
        Appointment entity = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId));
        appointmentMapper.applyUpdateToEntity(entity, dto);
        Appointment saved = appointmentRepository.save(entity);
        return appointmentMapper.entityToResponseDTO(saved);
    }

    public void delete(Long appointmentId) {
        if (!appointmentRepository.existsById(appointmentId)) {
            throw new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId);
        }
        appointmentRepository.deleteById(appointmentId);
    }

    public AppointmentDTO.Response cancelAppointment(Long appointmentId) {
        Appointment entity = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cuộc hẹn với ID: " + appointmentId));
        
        // Cập nhật status thành "từ chối lịch hẹn"
        entity.setStatus("Từ chối lịch hẹn");
        
        // Nếu có schedule, giải phóng slot
        if (entity.getSchedule() != null) {
            entity.getSchedule().setStatus("Available");
            doctorScheduleRepository.save(entity.getSchedule());
        }
        
        Appointment saved = appointmentRepository.save(entity);
        return appointmentMapper.entityToResponseDTO(saved);
    }
    
}


