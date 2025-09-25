package com.example.backend.service;

import com.example.backend.dto.PatientDTO;
import com.example.backend.model.Patient;
import com.example.backend.model.User;
import com.example.backend.model.Role;
import com.example.backend.repository.PatientRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.RoleRepository;
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
    private final RoleRepository roleRepository;

    @Transactional
    public PatientDTO createPatient(PatientDTO patientDTO) {
        if (patientRepository.existsByUser_Email(patientDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Get PATIENT role
        Role patientRole = roleRepository.findByName("PATIENT");
        if (patientRole == null) {
            throw new RuntimeException("PATIENT role not found");
        }

        User user = new User();
        user.setEmail(patientDTO.getEmail());
        user.setPasswordHash(patientDTO.getPassword()); // In real app, should hash password
        user.setFirstName(patientDTO.getFirstName());
        user.setLastName(patientDTO.getLastName());
        user.setPhone(patientDTO.getPhone());
        user.setGender(patientDTO.getGender());
        if (patientDTO.getDob() != null) {
            user.setDob(java.time.LocalDate.parse(patientDTO.getDob()));
        }
        user.setAddress(patientDTO.getAddress());
        user.setImg(patientDTO.getImg());
        user.setRole(patientRole);
        userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setHealthInsuranceNumber(patientDTO.getHealthInsuranceNumber());
        patient.setMedicalHistory(patientDTO.getMedicalHistory());

        Patient savedPatient = patientRepository.save(patient);
        return convertToDTO(savedPatient);
    }

    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAllActive().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PatientDTO getPatient(Integer id) {
        Patient patient = patientRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return convertToDTO(patient);
    }

    @Transactional
    public PatientDTO updatePatient(Integer id, PatientDTO patientDTO) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        User user = patient.getUser();
        user.setEmail(patientDTO.getEmail());
        if (patientDTO.getPassword() != null && !patientDTO.getPassword().isEmpty()) {
            user.setPasswordHash(patientDTO.getPassword()); // In real app, should hash password
        }
        user.setFirstName(patientDTO.getFirstName());
        user.setLastName(patientDTO.getLastName());
        user.setPhone(patientDTO.getPhone());
        user.setGender(patientDTO.getGender());
        if (patientDTO.getDob() != null) {
            user.setDob(java.time.LocalDate.parse(patientDTO.getDob()));
        }
        user.setAddress(patientDTO.getAddress());

        patient.setHealthInsuranceNumber(patientDTO.getHealthInsuranceNumber());
        patient.setMedicalHistory(patientDTO.getMedicalHistory());

        Patient updatedPatient = patientRepository.save(patient);
        return convertToDTO(updatedPatient);
    }

    @Transactional
    public void deletePatient(Integer id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        patient.setStatus("INACTIVE");
        patientRepository.save(patient);
    }

    private PatientDTO convertToDTO(Patient patient) {
        PatientDTO dto = new PatientDTO();
        dto.setPatientId(patient.getPatientId());
        dto.setCreatedAt(patient.getCreatedAt() != null ? patient.getCreatedAt().toLocalDate().toString() : null);
        dto.setStatus(patient.getStatus());
        dto.setEmail(patient.getUser().getEmail());
        dto.setFirstName(patient.getUser().getFirstName());
        dto.setLastName(patient.getUser().getLastName());
        dto.setPhone(patient.getUser().getPhone());
        dto.setGender(patient.getUser().getGender());
        dto.setDob(patient.getUser().getDob() != null ? patient.getUser().getDob().toString() : null);
        dto.setAddress(patient.getUser().getAddress());
        dto.setImg(patient.getUser().getImg());
        dto.setHealthInsuranceNumber(patient.getHealthInsuranceNumber());
        dto.setMedicalHistory(patient.getMedicalHistory());
        return dto;
    }
}