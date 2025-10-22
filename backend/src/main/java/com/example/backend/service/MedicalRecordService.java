package com.example.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.MedicalRecordDto;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.MedicalRecordMapper;
import com.example.backend.model.Appointment;
import com.example.backend.model.MedicalRecord;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.MedicalRecordRepository;

@Service
@Transactional
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicalRecordMapper medicalRecordMapper;

    public List<MedicalRecordDto> getAllMedicalRecords() {
        return medicalRecordRepository.findAll().stream()
                .map(medicalRecordMapper::toDto)
                .collect(Collectors.toList());
    }

    public Page<MedicalRecordDto> getAllMedicalRecords(Pageable pageable) {
        return medicalRecordRepository.findAll(pageable)
                .map(medicalRecordMapper::toDto);
    }

    public MedicalRecordDto getMedicalRecordById(Integer id) {
        MedicalRecord medicalRecord = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Medical Record not found with id: " + id));
        return medicalRecordMapper.toDto(medicalRecord);
    }

    public List<MedicalRecordDto> getMedicalRecordsByAppointmentId(Long appointmentId) {
        return medicalRecordRepository.findByAppointmentAppointmentId(appointmentId).stream()
                .map(medicalRecordMapper::toDto)
                .collect(Collectors.toList());
    }

    public MedicalRecordDto createMedicalRecord(MedicalRecordDto requestDto) {
        // Validate appointment exists
        Appointment appointment = appointmentRepository.findById(requestDto.getAppointmentId())
                .orElseThrow(() -> new NotFoundException("Appointment not found with id: " + requestDto.getAppointmentId()));

        // Check if medical record already exists for this appointment
        if (medicalRecordRepository.existsByAppointmentAppointmentId(requestDto.getAppointmentId())) {
            throw new IllegalArgumentException("Medical record already exists for appointment id: " + requestDto.getAppointmentId());
        }

        MedicalRecord medicalRecord = medicalRecordMapper.toEntity(requestDto);
        medicalRecord.setAppointment(appointment);
        MedicalRecord savedRecord = medicalRecordRepository.save(medicalRecord);
        return medicalRecordMapper.toDto(savedRecord);
    }

    public MedicalRecordDto updateMedicalRecord(Integer id, MedicalRecordDto requestDto) {
        MedicalRecord existingRecord = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Medical Record not found with id: " + id));
        
        medicalRecordMapper.updateEntity(existingRecord, requestDto);
        MedicalRecord updatedRecord = medicalRecordRepository.save(existingRecord);
        return medicalRecordMapper.toDto(updatedRecord);
    }

    public void deleteMedicalRecord(Integer id) {
        if (!medicalRecordRepository.existsById(id)) {
            throw new NotFoundException("Medical Record not found with id: " + id);
        }
        medicalRecordRepository.deleteById(id);
    }
    
}