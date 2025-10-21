package com.example.backend.service;

import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.exception.ConflictException;
import com.example.backend.exception.NotFoundException;
import com.example.backend.model.Patient;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.PatientRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;

/**
 * Service class cho Patient entity
 * Chứa business logic để xử lý các thao tác CRUD với Patient
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    
    @PersistenceContext
    private EntityManager entityManager;

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
        if (user.getRole() == null || !user.getRole().getName().equals("Patient")) {
            throw new ConflictException("User không phải là bệnh nhân (roleId phải = 3)");
        }

        // Kiểm tra user đã có thông tin patient chưa
        if (patientRepository.existsByPatientId(userId)) {
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
        patient.setPatientId(userId); // Set patientId = userId for @MapsId
        patient.setUser(user); // Set user reference
        patient.setHealthInsuranceNumber(healthInsuranceNumber);
        patient.setMedicalHistory(medicalHistory);

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
        // Status is managed by User entity, not Patient entity

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

        // Soft delete by updating both User status and Patient status
        if (patient.getUser() != null) {
            User user = patient.getUser();
            user.setStatus(User.UserStatus.INACTIVE);
            userRepository.save(user);
        }
        
        // Also update Patient status to maintain consistency
        patient.setStatus("INACTIVE");
        patientRepository.save(patient);
    }


    /**
     * Lấy patient theo userId
     * @param userId ID của user
     * @return patient nếu tìm thấy
     * @throws NotFoundException nếu không tìm thấy patient
     */
    @Transactional(readOnly = true)
    public Patient getPatientByUserId(Long userId) {
        return patientRepository.findByUserIdWithUserAndRole(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bệnh nhân với userId: " + userId));
    }

    /**
     * Kiểm tra user đã có thông tin patient chưa
     * @param userId ID của user
     * @return true nếu đã có thông tin patient
     */
    @Transactional(readOnly = true)
    public boolean isUserPatient(Long userId) {
        return patientRepository.existsByPatientId(userId);
    }

    /**
     * Lưu patient entity (dành cho SmartUserController)
     * @param patient entity patient cần lưu
     * @return patient đã được lưu
     */
    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }

    /**
     * Đăng ký bệnh nhân mới (tạo cả User và Patient)
     * @param request thông tin đăng ký bệnh nhân
     * @throws ConflictException nếu email đã tồn tại
     * @throws NotFoundException nếu không tìm thấy role Patient
     */
    @Transactional
    public void registerPatient(PatientRegisterRequest request) {
        // 1️⃣ Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email đã tồn tại: " + request.getEmail());
        }

        // 2️⃣ Lấy Role Patient (roleId = 3)
        Role patientRole = roleRepository.findById(3L)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy role Patient (roleId = 3)"));

        // 3️⃣ Tạo User
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setGender(request.getGender());
        user.setDateOfBirth(request.getDob());
        user.setAddress(request.getAddress());
        user.setRole(patientRole);
        user.setStatus(User.UserStatus.ACTIVE);

        // Save User first
        User savedUser = userRepository.save(user);
        entityManager.flush(); // Force flush to ensure User is persisted
        
        // Get the persisted User ID
        Long userId = savedUser.getId();

        // 4️⃣ Tạo Patient với User ID đã tồn tại
        createPatientWithExistingUser(userId, request);
        
        // 5️⃣ Gửi email chào mừng thông minh
        try {
            System.out.println("🔄 Bắt đầu gửi email chào mừng cho Patient: " + savedUser.getEmail());
            sendWelcomeEmail(savedUser);
            System.out.println("✅ Email chào mừng Patient đã được gửi thành công!");
        } catch (Exception e) {
            // Không throw exception để không ảnh hưởng đến việc tạo tài khoản
            System.err.println("❌ LỖI: Không thể gửi email chào mừng cho Patient: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Check if email already exists in users (helper used before creating pending registration)
    @Transactional(readOnly = true)
    public boolean isEmailTaken(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    private void createPatientWithExistingUser(Long userId, PatientRegisterRequest request) {
        // Get the User entity by ID (this ensures it's properly loaded)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));
        
        // Get next Patient ID
        Long nextPatientId = getNextPatientId();
        
        Patient patient = new Patient();
        patient.setPatientId(nextPatientId); // Set patientId manually
        patient.setUser(user); // Set user reference
        patient.setHealthInsuranceNumber(request.getHealthInsuranceNumber());
        patient.setMedicalHistory(request.getMedicalHistory());
        patient.setCreatedAt(java.time.LocalDate.now()); // Set default values
        patient.setStatus("ACTIVE");

        // Save Patient using repository
        patientRepository.save(patient);
    }
    
    private Long getNextPatientId() {
        // Simple approach: get max ID + 1
        try {
            Long maxId = patientRepository.findMaxPatientId().orElse(0L);
            return maxId + 1;
        } catch (Exception e) {
            return 1L; // Fallback to 1 if no patients exist
        }
    }

    /**
     * Request DTO cho đăng ký bệnh nhân
     */
    public static class PatientRegisterRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private String phone;
        private User.Gender gender;
        private java.time.LocalDate dob;
        private String address;
        private String healthInsuranceNumber;
        private String medicalHistory;

        // Getters and Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public User.Gender getGender() { return gender; }
        public void setGender(User.Gender gender) { this.gender = gender; }

        public java.time.LocalDate getDob() { return dob; }
        public void setDob(java.time.LocalDate dob) { this.dob = dob; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }

        public String getMedicalHistory() { return medicalHistory; }
        public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
    }
    
    /**
     * Gửi email chào mừng thông minh cho Patient mới
     */
    private void sendWelcomeEmail(User user) {
        try {
            String roleName = user.getRole() != null ? user.getRole().getName() : "Bệnh nhân";
            String userName = (user.getFirstName() != null ? user.getFirstName() : "") + 
                            (user.getLastName() != null ? " " + user.getLastName() : "");
            
            String subject = "🎉 Chào mừng bạn đến với ClinicBooking!";
            String content = buildWelcomeEmailContent(userName, roleName, user.getEmail(), user);
            
            emailService.sendSimpleEmail(user.getEmail(), subject, content);
            System.out.println("✅ Email chào mừng đã gửi đến: " + user.getEmail());
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi gửi email chào mừng: " + e.getMessage());
            throw e;
        }
    }
    
    /**
     * Xây dựng nội dung email chào mừng thông minh
     */
    private String buildWelcomeEmailContent(String userName, String roleName, String email, User user) {
        StringBuilder content = new StringBuilder();
        
        content.append("Xin chào ").append(userName).append("!\n\n");
        content.append("🎉 Chúc mừng bạn đã đăng ký thành công tài khoản ").append(roleName).append(" tại ClinicBooking!\n\n");
        
        // Nội dung thông minh dựa trên role
        if ("Patient".equalsIgnoreCase(roleName)) {
            content.append("🏥 Với tài khoản Bệnh nhân, bạn có thể:\n");
            content.append("• Đặt lịch khám với bác sĩ chuyên khoa\n");
            content.append("• Xem lịch sử khám bệnh\n");
            content.append("• Nhận nhắc nhở lịch khám\n");
            content.append("• Quản lý hồ sơ sức khỏe cá nhân\n\n");
        } else {
            content.append("🔧 Với tài khoản ").append(roleName).append(", bạn có thể:\n");
            content.append("• Truy cập các tính năng phù hợp với vai trò\n");
            content.append("• Nhận thông báo quan trọng\n\n");
        }
        
        content.append("📧 Email đăng nhập: ").append(email).append("\n");
        content.append("🔐 Mật khẩu: [Mật khẩu bạn đã đặt]\n\n");
        
        content.append("💡 Mẹo sử dụng:\n");
        content.append("• Luôn kiểm tra email để nhận thông báo quan trọng\n");
        content.append("• Cập nhật thông tin cá nhân để được phục vụ tốt nhất\n");
        content.append("• Liên hệ hỗ trợ nếu cần trợ giúp\n\n");
        
        content.append("Chúc bạn có trải nghiệm tuyệt vời với ClinicBooking!\n\n");
        content.append("Trân trọng,\n");
        content.append("Đội ngũ ClinicBooking 🏥");
        
        return content.toString();
    }

}