package com.example.backend.service;

import com.example.backend.dto.PatientDTO;
import com.example.backend.model.Patient;
import com.example.backend.model.User;
import com.example.backend.repository.PatientRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public PatientDTO createPatient(PatientDTO patientDTO) {
        if (patientRepository.existsByUser_Email(patientDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(patientDTO.getEmail());
        user.setFirstName(patientDTO.getFirstName());
        user.setLastName(patientDTO.getLastName());
        user.setPhone(patientDTO.getPhone());
        // Set other user fields as needed
        userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setHealthInsuranceNumber(patientDTO.getHealthInsuranceNumber());
        patient.setMedicalHistory(patientDTO.getMedicalHistory());

        Patient savedPatient = patientRepository.save(patient);
        return convertToDTO(savedPatient);
    }

    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PatientDTO getPatient(Integer id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return convertToDTO(patient);
    }

    @Transactional
    public PatientDTO updatePatient(Integer id, PatientDTO patientDTO) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        User user = patient.getUser();
        user.setFirstName(patientDTO.getFirstName());
        user.setLastName(patientDTO.getLastName());
        user.setPhone(patientDTO.getPhone());

        patient.setHealthInsuranceNumber(patientDTO.getHealthInsuranceNumber());
        patient.setMedicalHistory(patientDTO.getMedicalHistory());

        Patient updatedPatient = patientRepository.save(patient);
        return convertToDTO(updatedPatient);
    }

    @Transactional
    public void deletePatient(Integer id) {
        patientRepository.deleteById(id);
    }

    private PatientDTO convertToDTO(Patient patient) {
        PatientDTO dto = new PatientDTO();
        dto.setPatientId(patient.getPatientId());
        dto.setEmail(patient.getUser().getEmail());
        dto.setFirstName(patient.getUser().getFirstName());
        dto.setLastName(patient.getUser().getLastName());
        dto.setPhone(patient.getUser().getPhone());
        dto.setHealthInsuranceNumber(patient.getHealthInsuranceNumber());
        dto.setMedicalHistory(patient.getMedicalHistory());
        return dto;
    }
}