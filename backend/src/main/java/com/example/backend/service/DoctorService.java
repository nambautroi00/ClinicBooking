package com.example.backend.service;

import com.example.backend.dto.DoctorDTO;
import com.example.backend.model.Doctor;
import com.example.backend.model.User;
import com.example.backend.model.Department;
import com.example.backend.model.Role;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public DoctorDTO createDoctor(DoctorDTO doctorDTO) {
        if (doctorRepository.existsByUser_Email(doctorDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Department department = departmentRepository.findById(doctorDTO.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        // Get DOCTOR role
        Role doctorRole = roleRepository.findByName("DOCTOR");
        if (doctorRole == null) {
            throw new RuntimeException("DOCTOR role not found");
        }

        User user = new User();
        user.setEmail(doctorDTO.getEmail());
        user.setPasswordHash(doctorDTO.getPassword()); // In real app, should hash password
        user.setFirstName(doctorDTO.getFirstName());
        user.setLastName(doctorDTO.getLastName());
        user.setPhone(doctorDTO.getPhone());
        user.setGender(doctorDTO.getGender());
        if (doctorDTO.getDob() != null) {
            user.setDob(java.time.LocalDate.parse(doctorDTO.getDob()));
        }
        user.setAddress(doctorDTO.getAddress());
        user.setImg(doctorDTO.getImg());
        user.setRole(doctorRole);
        userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setDepartment(department);
        doctor.setSpecialty(doctorDTO.getSpecialty());
        doctor.setBio(doctorDTO.getBio());

        Doctor savedDoctor = doctorRepository.save(doctor);
        return convertToDTO(savedDoctor);
    }

    public List<DoctorDTO> getAllDoctors() {
        return doctorRepository.findAllActive().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DoctorDTO getDoctor(Integer id) {
        Doctor doctor = doctorRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return convertToDTO(doctor);
    }

    @Transactional
    public DoctorDTO updateDoctor(Integer id, DoctorDTO doctorDTO) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (doctorDTO.getDepartmentId() != null) {
            Department department = departmentRepository.findById(doctorDTO.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            doctor.setDepartment(department);
        }

        User user = doctor.getUser();
        user.setEmail(doctorDTO.getEmail());
        if (doctorDTO.getPassword() != null && !doctorDTO.getPassword().isEmpty()) {
            user.setPasswordHash(doctorDTO.getPassword()); // In real app, should hash password
        }
        user.setFirstName(doctorDTO.getFirstName());
        user.setLastName(doctorDTO.getLastName());
        user.setPhone(doctorDTO.getPhone());
        user.setGender(doctorDTO.getGender());
        if (doctorDTO.getDob() != null) {
            user.setDob(java.time.LocalDate.parse(doctorDTO.getDob()));
        }
        user.setAddress(doctorDTO.getAddress());

        doctor.setSpecialty(doctorDTO.getSpecialty());
        doctor.setBio(doctorDTO.getBio());

        Doctor updatedDoctor = doctorRepository.save(doctor);
        return convertToDTO(updatedDoctor);
    }

    @Transactional
    public void deleteDoctor(Integer id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctor.setStatus("INACTIVE");
        doctorRepository.save(doctor);
    }

    private DoctorDTO convertToDTO(Doctor doctor) {
        DoctorDTO dto = new DoctorDTO();
        dto.setDoctorId(doctor.getDoctorId());
        dto.setCreatedAt(doctor.getCreatedAt() != null ? doctor.getCreatedAt().toLocalDate().toString() : null);
        dto.setStatus(doctor.getStatus());
        dto.setEmail(doctor.getUser().getEmail());
        dto.setFirstName(doctor.getUser().getFirstName());
        dto.setLastName(doctor.getUser().getLastName());
        dto.setPhone(doctor.getUser().getPhone());
        dto.setGender(doctor.getUser().getGender());
        dto.setDob(doctor.getUser().getDob() != null ? doctor.getUser().getDob().toString() : null);
        dto.setAddress(doctor.getUser().getAddress());
        dto.setImg(doctor.getUser().getImg());
        dto.setSpecialty(doctor.getSpecialty());
        dto.setBio(doctor.getBio());
        dto.setDepartmentId(doctor.getDepartment().getDepartmentId());
        return dto;
    }
}