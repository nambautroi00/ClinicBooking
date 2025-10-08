package com.example.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.exception.ConflictException;
import com.example.backend.exception.NotFoundException;
import com.example.backend.model.Patient;
import com.example.backend.model.User;
import com.example.backend.repository.PatientRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service class cho Patient entity
 * Chứa business logic để xử lý các thao tác CRUD với Patient
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    /**
     * Lấy tất cả patient với thông tin User và Role
     * @return danh sách tất cả patient
     */
    @Transactional(readOnly = true)
    public List<Patient> getAllPatientsWithUserAndRole() {
        return patientRepository.findAllWithUserAndRole();
    }

    /**
     * Lấy patient theo ID với thông tin User và Role
     * @param patientId ID của patient
     * @return patient nếu tìm thấy
     * @throws NotFoundException nếu không tìm thấy patient
     */
    @Transactional(readOnly = true)
    public Patient getPatientByIdWithUserAndRole(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + patientId));
    }

    /**
     * Tìm patient theo tên với thông tin User và Role
     * @param keyword từ khóa tìm kiếm
     * @return danh sách patient theo tên
     */
    @Transactional(readOnly = true)
    public List<Patient> getPatientsByNameWithUserAndRole(String keyword) {
        return patientRepository.findByNameContainingWithUserAndRole(keyword);
    }

    /**
     * Tìm patient theo số bảo hiểm y tế với thông tin User và Role
     * @param insuranceNumber số bảo hiểm y tế
     * @return patient nếu tìm thấy
     */
    @Transactional(readOnly = true)
    public Optional<Patient> getPatientByInsuranceNumberWithUserAndRole(String insuranceNumber) {
        return patientRepository.findByHealthInsuranceNumberWithUserAndRole(insuranceNumber);
    }

    /**
     * Tìm patient theo email với thông tin User và Role
     * @param email email của patient
     * @return patient nếu tìm thấy
     */
    @Transactional(readOnly = true)
    public Optional<Patient> getPatientByEmailWithUserAndRole(String email) {
        return patientRepository.findByEmailWithUserAndRole(email);
    }

    /**
     * Tạo patient mới
     * @param userId ID của user (phải có roleId = 3)
     * @param healthInsuranceNumber số bảo hiểm y tế
     * @param medicalHistory tiền sử bệnh
     * @return patient đã được tạo
     * @throws NotFoundException nếu không tìm thấy user
     * @throws ConflictException nếu user không phải là patient hoặc đã có thông tin patient
     */
    public Patient createPatient(Long userId, String healthInsuranceNumber, String medicalHistory) {
        // Kiểm tra user tồn tại
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user với ID: " + userId));

        // Kiểm tra user có phải là patient không (roleId = 3)
        if (!user.isPatient()) {
            throw new ConflictException("User không phải là bệnh nhân (roleId phải = 3)");
        }

        // Kiểm tra user đã có thông tin patient chưa
        if (patientRepository.existsByUserId(userId)) {
            throw new ConflictException("User đã có thông tin bệnh nhân");
        }

        // Kiểm tra số bảo hiểm y tế đã tồn tại chưa (nếu có)
        if (healthInsuranceNumber != null && !healthInsuranceNumber.trim().isEmpty()) {
            if (patientRepository.findByHealthInsuranceNumberWithUserAndRole(healthInsuranceNumber).isPresent()) {
                throw new ConflictException("Số bảo hiểm y tế đã tồn tại: " + healthInsuranceNumber);
            }
        }

        // Tạo patient mới
        Patient patient = new Patient();
        patient.setUserId(userId); // Set userId thay vì @MapsId
        patient.setHealthInsuranceNumber(healthInsuranceNumber);
        patient.setMedicalHistory(medicalHistory);
        patient.setStatus("ACTIVE");

        return patientRepository.save(patient);
    }

    /**
     * Cập nhật thông tin patient
     * @param patientId ID của patient
     * @param healthInsuranceNumber số bảo hiểm y tế mới
     * @param medicalHistory tiền sử bệnh mới
     * @param status trạng thái mới
     * @return patient đã được cập nhật
     * @throws NotFoundException nếu không tìm thấy patient
     */
    public Patient updatePatient(Long patientId, String healthInsuranceNumber, String medicalHistory, String status) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + patientId));

        // Kiểm tra số bảo hiểm y tế mới có trùng với patient khác không (nếu có)
        if (healthInsuranceNumber != null && !healthInsuranceNumber.trim().isEmpty() 
            && !healthInsuranceNumber.equals(patient.getHealthInsuranceNumber())) {
            Optional<Patient> existingPatient = patientRepository.findByHealthInsuranceNumberWithUserAndRole(healthInsuranceNumber);
            if (existingPatient.isPresent() && !existingPatient.get().getPatientId().equals(patientId)) {
                throw new ConflictException("Số bảo hiểm y tế đã tồn tại: " + healthInsuranceNumber);
            }
        }

        if (healthInsuranceNumber != null) {
            patient.setHealthInsuranceNumber(healthInsuranceNumber);
        }
        if (medicalHistory != null) {
            patient.setMedicalHistory(medicalHistory);
        }
        if (status != null) {
            patient.setStatus(status);
        }

        return patientRepository.save(patient);
    }

    /**
     * Xóa patient (soft delete)
     * @param patientId ID của patient
     * @throws NotFoundException nếu không tìm thấy patient
     */
    public void deletePatient(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với ID: " + patientId));

        patient.setStatus("DELETED");
        patientRepository.save(patient);
    }

    /**
     * Xóa patient vĩnh viễn (hard delete)
     * @param patientId ID của patient
     * @throws NotFoundException nếu không tìm thấy patient
     */
    public void hardDeletePatient(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new NotFoundException("Không tìm thấy bệnh nhân với ID: " + patientId);
        }
        patientRepository.deleteById(patientId);
    }

    /**
     * Lấy patient theo userId
     * @param userId ID của user
     * @return patient nếu tìm thấy
     * @throws NotFoundException nếu không tìm thấy patient
     */
    @Transactional(readOnly = true)
    public Patient getPatientByUserId(Long userId) {
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với userId: " + userId));
    }

    /**
     * Kiểm tra user đã có thông tin patient chưa
     * @param userId ID của user
     * @return true nếu đã có thông tin patient
     */
    @Transactional(readOnly = true)
    public boolean isUserPatient(Long userId) {
        return patientRepository.existsByUserId(userId);
    }

    /**
     * Lưu patient entity (dành cho SmartUserController)
     * @param patient entity patient cần lưu
     * @return patient đã được lưu
     */
    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }
}