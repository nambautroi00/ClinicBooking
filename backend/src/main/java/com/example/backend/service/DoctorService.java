package com.example.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.exception.ConflictException;
import com.example.backend.exception.NotFoundException;
import com.example.backend.model.Doctor;
import com.example.backend.model.User;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service class cho Doctor entity
 * Chứa business logic để xử lý các thao tác CRUD với Doctor
 */
@Service
@RequiredArgsConstructor
@Transactional
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    /**
     * Lấy tất cả doctor với thông tin User và Role
     * @return danh sách tất cả doctor
     */
    @Transactional(readOnly = true)
    public List<Doctor> getAllDoctorsWithUserAndRole() {
        return doctorRepository.findAllWithUserAndRole();
    }

    /**
     * Lấy doctor theo ID với thông tin User và Role
     * @param doctorId ID của doctor
     * @return doctor nếu tìm thấy
     * @throws NotFoundException nếu không tìm thấy doctor
     */
    @Transactional(readOnly = true)
    public Doctor getDoctorByIdWithUserAndRole(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với ID: " + doctorId));
    }

    /**
     * Tìm doctor theo specialty với thông tin User và Role
     * @param specialty chuyên khoa
     * @return danh sách doctor theo specialty
     */
    @Transactional(readOnly = true)
    public List<Doctor> getDoctorsBySpecialtyWithUserAndRole(String specialty) {
        return doctorRepository.findBySpecialtyWithUserAndRole(specialty);
    }

    /**
     * Tìm doctor theo department với thông tin User và Role
     * @param departmentId ID của department
     * @return danh sách doctor theo department
     */
    @Transactional(readOnly = true)
    public List<Doctor> getDoctorsByDepartmentWithUserAndRole(Long departmentId) {
        return doctorRepository.findByDepartmentWithUserAndRole(departmentId);
    }

    /**
     * Tìm doctor theo tên với thông tin User và Role
     * @param keyword từ khóa tìm kiếm
     * @return danh sách doctor theo tên
     */
    @Transactional(readOnly = true)
    public List<Doctor> getDoctorsByNameWithUserAndRole(String keyword) {
        return doctorRepository.findByNameContainingWithUserAndRole(keyword);
    }

    /**
     * Tạo doctor mới
     * @param userId ID của user (phải có roleId = 2)
     * @param bio tiểu sử
     * @param specialty chuyên khoa
     * @param departmentId ID của department
     * @return doctor đã được tạo
     * @throws NotFoundException nếu không tìm thấy user
     * @throws ConflictException nếu user không phải là doctor hoặc đã có thông tin doctor
     */
    public Doctor createDoctor(Long userId, String bio, String specialty, Long departmentId) {
        // Kiểm tra user tồn tại
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user với ID: " + userId));

        // Kiểm tra user có phải là doctor không (roleId = 2)
        if (!user.isDoctor()) {
            throw new ConflictException("User không phải là bác sĩ (roleId phải = 2)");
        }

        // Kiểm tra user đã có thông tin doctor chưa
        if (doctorRepository.existsByUserId(userId)) {
            throw new ConflictException("User đã có thông tin bác sĩ");
        }

        // Tạo doctor mới
        Doctor doctor = new Doctor();
        doctor.setUserId(userId); // Set userId thay vì @MapsId
        doctor.setBio(bio);
        doctor.setSpecialty(specialty);
        doctor.setStatus("ACTIVE");

        return doctorRepository.save(doctor);
    }

    /**
     * Cập nhật thông tin doctor
     * @param doctorId ID của doctor
     * @param bio tiểu sử mới
     * @param specialty chuyên khoa mới
     * @param departmentId ID department mới
     * @param status trạng thái mới
     * @return doctor đã được cập nhật
     * @throws NotFoundException nếu không tìm thấy doctor
     */
    public Doctor updateDoctor(Long doctorId, String bio, String specialty, Long departmentId, String status) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với ID: " + doctorId));

        if (bio != null) {
            doctor.setBio(bio);
        }
        if (specialty != null) {
            doctor.setSpecialty(specialty);
        }
        if (status != null) {
            doctor.setStatus(status);
        }

        return doctorRepository.save(doctor);
    }

    /**
     * Xóa doctor (soft delete)
     * @param doctorId ID của doctor
     * @throws NotFoundException nếu không tìm thấy doctor
     */
    public void deleteDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với ID: " + doctorId));

        doctor.setStatus("DELETED");
        doctorRepository.save(doctor);
    }

    /**
     * Xóa doctor vĩnh viễn (hard delete)
     * @param doctorId ID của doctor
     * @throws NotFoundException nếu không tìm thấy doctor
     */
    public void hardDeleteDoctor(Long doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new NotFoundException("Không tìm thấy bác sĩ với ID: " + doctorId);
        }
        doctorRepository.deleteById(doctorId);
    }

    /**
     * Lấy doctor theo userId
     * @param userId ID của user
     * @return doctor nếu tìm thấy
     * @throws NotFoundException nếu không tìm thấy doctor
     */
    @Transactional(readOnly = true)
    public Doctor getDoctorByUserId(Long userId) {
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bác sĩ với userId: " + userId));
    }

    /**
     * Kiểm tra user đã có thông tin doctor chưa
     * @param userId ID của user
     * @return true nếu đã có thông tin doctor
     */
    @Transactional(readOnly = true)
    public boolean isUserDoctor(Long userId) {
        return doctorRepository.existsByUserId(userId);
    }

    /**
     * Lưu doctor entity (dành cho SmartUserController)
     * @param doctor entity doctor cần lưu
     * @return doctor đã được lưu
     */
    public Doctor saveDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }
}