package com.example.backend.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.exception.ConflictException;
import com.example.backend.exception.NotFoundException;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.DoctorService;
import com.example.backend.service.PatientService;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.PatientRepository;
import com.example.backend.model.Doctor;
import com.example.backend.model.Patient;

import lombok.RequiredArgsConstructor;

/**
 * Service class cho User entity
 * Chứa business logic để xử lý các thao tác CRUD với User
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DoctorService doctorService;
    private final PatientService patientService;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    /**
     * Lấy tất cả user với thông tin role
     * @param pageable thông tin phân trang
     * @return danh sách user với phân trang
     */
    @Transactional(readOnly = true)
    public Page<User> getAllUsersWithRole(Pageable pageable) {
        return userRepository.findAllWithRole(pageable);
    }

    /**
     * Lấy user theo ID với thông tin role
     * @param userId ID của user
     * @return user nếu tìm thấy
     * @throws NotFoundException nếu không tìm thấy user
     */
    @Transactional(readOnly = true)
    public User getUserByIdWithRole(Long userId) {
        return userRepository.findByIdWithRole(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user với ID: " + userId));
    }

    /**
     * Lấy user theo email với thông tin role
     * @param email email của user
     * @return user nếu tìm thấy
     * @throws NotFoundException nếu không tìm thấy user
     */
    @Transactional(readOnly = true)
    public User getUserByEmailWithRole(String email) {
        return userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user với email: " + email));
    }

    /**
     * Tìm user với các bộ lọc
     * @param email email để tìm kiếm
     * @param firstName tên để tìm kiếm
     * @param lastName họ để tìm kiếm
     * @param status trạng thái để tìm kiếm
     * @param roleId ID role để tìm kiếm
     * @param pageable thông tin phân trang
     * @return danh sách user với phân trang
     */
    @Transactional(readOnly = true)
    public Page<User> searchUsersWithFilters(String email, String firstName, String lastName, 
                                           User.UserStatus status, Long roleId, Pageable pageable) {
        return userRepository.findUsersWithFilters(email, firstName, lastName, status, roleId, pageable);
    }

    /**
     * Lấy tất cả user cùng dữ liệu Doctor/Patient nếu có
     * @return danh sách user với thông tin Doctor/Patient
     */
    @Transactional(readOnly = true)
    public List<User> getAllUsersWithDoctorAndPatientInfo() {
        return userRepository.findAllWithDoctorAndPatientInfo();
    }

    /**
     * Tìm user theo roleId với thông tin Doctor/Patient
     * @param roleId ID của role
     * @return danh sách user theo role
     */
    @Transactional(readOnly = true)
    public List<User> getUsersByRoleIdWithDoctorAndPatientInfo(Long roleId) {
        return userRepository.findByRoleIdWithDoctorAndPatientInfo(roleId);
    }

    /**
     * Tìm user theo tên với thông tin Doctor/Patient
     * @param keyword từ khóa tìm kiếm
     * @return danh sách user theo tên
     */
    @Transactional(readOnly = true)
    public List<User> getUsersByNameWithDoctorAndPatientInfo(String keyword) {
        return userRepository.findByNameContainingWithDoctorAndPatientInfo(keyword);
    }

    /**
     * Tạo user mới
     * @param email email của user
     * @param passwordHash hash của password
     * @param firstName tên
     * @param lastName họ
     * @param phone số điện thoại
     * @param gender giới tính
     * @param dateOfBirth ngày sinh
     * @param address địa chỉ
     * @param roleId ID của role
     * @return user đã được tạo
     * @throws ConflictException nếu email đã tồn tại
     * @throws NotFoundException nếu không tìm thấy role hoặc roleId null
     */
    public User createUser(String email, String passwordHash, String firstName, String lastName, 
                          String phone, User.Gender gender, java.time.LocalDate dateOfBirth, 
                          String address, Long roleId) {
        
        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email đã tồn tại: " + email);
        }

        // Kiểm tra roleId không null
        if (roleId == null) {
            throw new IllegalArgumentException("RoleId không được để trống");
        }

        // Kiểm tra role tồn tại
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy role với ID: " + roleId));

        // Tạo user mới
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setGender(gender);
        user.setDateOfBirth(dateOfBirth);
        user.setAddress(address);
        user.setRole(role);
        user.setStatus(User.UserStatus.ACTIVE);

        User savedUser = userRepository.save(user);

        // Tự động tạo Doctor hoặc Patient record dựa trên role
        System.out.println("🔍 Bắt đầu tạo record cho userId: " + savedUser.getUserId() + ", roleId: " + roleId);
        
        if (roleId == 18L) { // Doctor role
            System.out.println("👨‍⚕️ Tạo doctor record...");
            try {
                Doctor doctor = new Doctor();
                doctor.setUserId(savedUser.getUserId());
                doctor.setBio("Bác sĩ chuyên khoa");
                doctor.setSpecialty("Nội khoa");
                doctor.setStatus("ACTIVE");
                
                Doctor savedDoctor = doctorRepository.save(doctor);
                System.out.println("✅ Đã tạo doctor record với ID: " + savedDoctor.getDoctorId() + " cho userId: " + savedUser.getUserId());
            } catch (Exception e) {
                System.err.println("❌ Lỗi khi tạo doctor record: " + e.getMessage());
                e.printStackTrace();
            }
        } else if (roleId == 19L) { // Patient role
            System.out.println("🏥 Tạo patient record...");
            try {
                Patient patient = new Patient();
                patient.setUserId(savedUser.getUserId());
                patient.setHealthInsuranceNumber(null);
                patient.setMedicalHistory(null);
                patient.setStatus("ACTIVE");
                
                Patient savedPatient = patientRepository.save(patient);
                System.out.println("✅ Đã tạo patient record với ID: " + savedPatient.getPatientId() + " cho userId: " + savedUser.getUserId());
            } catch (Exception e) {
                System.err.println("❌ Lỗi khi tạo patient record: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("ℹ️ Không cần tạo doctor/patient record cho roleId: " + roleId);
        }

        return savedUser;
    }

    /**
     * Cập nhật thông tin user
     * @param userId ID của user
     * @param email email mới
     * @param firstName tên mới
     * @param lastName họ mới
     * @param phone số điện thoại mới
     * @param gender giới tính mới
     * @param dateOfBirth ngày sinh mới
     * @param address địa chỉ mới
     * @param status trạng thái mới
     * @param roleId ID role mới
     * @return user đã được cập nhật
     * @throws NotFoundException nếu không tìm thấy user hoặc role
     * @throws ConflictException nếu email mới đã tồn tại
     */
    public User updateUser(Long userId, String email, String firstName, String lastName, 
                          String phone, User.Gender gender, java.time.LocalDate dateOfBirth, 
                          String address, User.UserStatus status, Long roleId) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user với ID: " + userId));

        // Kiểm tra email mới có trùng với user khác không (nếu có)
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new ConflictException("Email đã tồn tại: " + email);
            }
            user.setEmail(email);
        }

        // Kiểm tra role mới tồn tại (nếu có)
        if (roleId != null) {
            try {
                Long currentRoleId = (user.getRole() != null) ? user.getRole().getId() : null;
                if (currentRoleId == null || !currentRoleId.equals(roleId)) {
                    Role role = roleRepository.findById(roleId)
                            .orElseThrow(() -> new NotFoundException("Không tìm thấy role với ID: " + roleId));
                    user.setRole(role);
                }
            } catch (Exception e) {
                // Nếu có lỗi với Hibernate proxy, tìm lại user
                user = userRepository.findById(userId)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy user với ID: " + userId));
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy role với ID: " + roleId));
                user.setRole(role);
            }
        }

        if (firstName != null) {
            user.setFirstName(firstName);
        }
        if (lastName != null) {
            user.setLastName(lastName);
        }
        if (phone != null) {
            user.setPhone(phone);
        }
        if (gender != null) {
            user.setGender(gender);
        }
        if (dateOfBirth != null) {
            user.setDateOfBirth(dateOfBirth);
        }
        if (address != null) {
            user.setAddress(address);
        }
        if (status != null) {
            user.setStatus(status);
        }

        return userRepository.save(user);
    }

    /**
     * Xóa user (soft delete)
     * @param userId ID của user
     * @throws NotFoundException nếu không tìm thấy user
     */
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user với ID: " + userId));

        user.setStatus(User.UserStatus.DELETED);
        userRepository.save(user);
    }

    /**
     * Xóa user vĩnh viễn (hard delete)
     * @param userId ID của user
     * @throws NotFoundException nếu không tìm thấy user
     */
    public void hardDeleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException("Không tìm thấy user với ID: " + userId);
        }
        userRepository.deleteById(userId);
    }

    /**
     * Đếm số user theo roleId
     * @param roleId ID của role
     * @return số lượng user
     */
    @Transactional(readOnly = true)
    public long countUsersByRoleId(Long roleId) {
        return userRepository.countByRoleId(roleId);
    }

    /**
     * Kiểm tra email đã tồn tại chưa
     * @param email email cần kiểm tra
     * @return true nếu email đã tồn tại
     */
    @Transactional(readOnly = true)
    public boolean isEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Tạo doctor record trong transaction riêng
     * @param userId ID của user
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createDoctorRecordAsync(Long userId) {
        try {
            Doctor doctor = new Doctor();
            doctor.setUserId(userId);
            doctor.setBio("Bác sĩ chuyên khoa");
            doctor.setSpecialty("Nội khoa");
            doctor.setStatus("ACTIVE");
            // Không set departmentId vì có thể gây lỗi constraint
            
            doctorRepository.save(doctor);
            System.out.println("Đã tạo doctor record cho userId: " + userId);
        } catch (Exception e) {
            System.err.println("Lỗi khi tạo doctor record: " + e.getMessage());
        }
    }

    /**
     * Tạo patient record trong transaction riêng
     * @param userId ID của user
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createPatientRecordAsync(Long userId) {
        try {
            Patient patient = new Patient();
            patient.setUserId(userId);
            patient.setHealthInsuranceNumber(null);
            patient.setMedicalHistory(null);
            patient.setStatus("ACTIVE");
            
            patientRepository.save(patient);
            System.out.println("Đã tạo patient record cho userId: " + userId);
        } catch (Exception e) {
            System.err.println("Lỗi khi tạo patient record: " + e.getMessage());
        }
    }
}