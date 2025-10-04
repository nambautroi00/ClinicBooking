package com.example.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.PatientDTO;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.PatientMapper;
import com.example.backend.model.Patient;
import com.example.backend.model.User;
import com.example.backend.repository.PatientRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PatientMapper patientMapper;

    @Transactional(readOnly = true)
    public Page<PatientDTO.Response> getAllPatients(Pageable pageable) {
        return patientRepository.findAll(pageable).map(patientMapper::entityToResponseDTO);
    }

    @Transactional(readOnly = true)
    public PatientDTO.Response getPatientById(Long id) {
        Patient patient = findPatientById(id);
        return patientMapper.entityToResponseDTO(patient);
    }

    public PatientDTO.Response createPatient(PatientDTO.Create createDTO) {
        User user = findUserById(createDTO.getUserId());
        
        // Check if patient already exists for this user
        if (patientRepository.existsById(user.getId())) {
            throw new RuntimeException("Bệnh nhân đã tồn tại cho người dùng này");
        }
        
        Patient patient = patientMapper.createDTOToEntity(createDTO, user);
        Patient savedPatient = patientRepository.save(patient);
        
        return patientMapper.entityToResponseDTO(savedPatient);
    }

    public PatientDTO.Response updatePatient(Long id, PatientDTO.Update updateDTO) {
        Patient patient = findPatientById(id);
        patientMapper.updateEntityFromDTO(patient, updateDTO);
        Patient updatedPatient = patientRepository.save(patient);
        return patientMapper.entityToResponseDTO(updatedPatient);
    }

    public void deletePatient(Long id) {
        Patient patient = findPatientById(id);
        // Soft delete - chỉ thay đổi status
        patient.setStatus("DELETED");
        patientRepository.save(patient);
    }

    public void hardDeletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy bệnh nhân với ID: " + id);
        }
        patientRepository.deleteById(id);
    }

    // Helper Methods
    private Patient findPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + id));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + id));
    }
}
