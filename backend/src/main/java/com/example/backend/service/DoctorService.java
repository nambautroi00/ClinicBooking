package com.example.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.DoctorDTO;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.DoctorMapper;
import com.example.backend.model.Department;
import com.example.backend.model.Doctor;
import com.example.backend.model.User;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorMapper doctorMapper;

    @Transactional(readOnly = true)
    public Page<DoctorDTO.Response> getAllDoctors(Pageable pageable) {
        return doctorRepository.findAll(pageable).map(doctorMapper::entityToResponseDTO);
    }

    @Transactional(readOnly = true)
    public DoctorDTO.Response getDoctorById(Long id) {
        Doctor doctor = findDoctorById(id);
        return doctorMapper.entityToResponseDTO(doctor);
    }

    public DoctorDTO.Response createDoctor(DoctorDTO.Create createDTO) {
        User user = findUserById(createDTO.getUserId());
        Department department = findDepartmentById(createDTO.getDepartmentId());
        
        // Check if doctor already exists for this user
        if (doctorRepository.existsById(user.getId())) {
            throw new RuntimeException("Bác sĩ đã tồn tại cho người dùng này");
        }
        
        Doctor doctor = doctorMapper.createDTOToEntity(createDTO, user, department);
        Doctor savedDoctor = doctorRepository.save(doctor);
        
        return doctorMapper.entityToResponseDTO(savedDoctor);
    }

    public DoctorDTO.Response updateDoctor(Long id, DoctorDTO.Update updateDTO) {
        Doctor doctor = findDoctorById(id);
        
        // Update department if provided
        if (updateDTO.getDepartmentId() != null) {
            Department department = findDepartmentById(updateDTO.getDepartmentId());
            doctor.setDepartment(department);
        }
        
        doctorMapper.updateEntityFromDTO(doctor, updateDTO);
        Doctor updatedDoctor = doctorRepository.save(doctor);
        return doctorMapper.entityToResponseDTO(updatedDoctor);
    }

    public void deleteDoctor(Long id) {
        Doctor doctor = findDoctorById(id);
        // Soft delete - chỉ thay đổi status
        doctor.setStatus("DELETED");
        doctorRepository.save(doctor);
    }

    public void hardDeleteDoctor(Long id) {
        if (!doctorRepository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy bác sĩ với ID: " + id);
        }
        doctorRepository.deleteById(id);
    }

    // Helper Methods
    private Doctor findDoctorById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với ID: " + id));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + id));
    }

    private Department findDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khoa với ID: " + id));
    }
}
