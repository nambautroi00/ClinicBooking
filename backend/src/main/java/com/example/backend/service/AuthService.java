package com.example.backend.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.AuthDTO;
import com.example.backend.dto.UserDTO;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.UserMapper;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.model.Doctor;
import com.example.backend.model.Patient;
import com.example.backend.model.Department;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.DoctorRepository;
import com.example.backend.repository.PatientRepository;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.service.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DepartmentRepository departmentRepository;
    private final EmailOtpService emailOtpService;
    private final EmailService emailService;

    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest loginRequest) {
        try {
            User user = userRepository.findByEmailWithRole(loginRequest.getEmail())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với email: " + loginRequest.getEmail()));

            // Kiểm tra trạng thái user
            if (user.getStatus() != User.UserStatus.ACTIVE) {
                return new AuthDTO.LoginResponse("Tài khoản đã bị khóa hoặc không hoạt động", false, null, null);
            }

            // Kiểm tra mật khẩu (tạm thời so sánh trực tiếp - sau này sẽ dùng BCrypt)
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
                return new AuthDTO.LoginResponse("Mật khẩu không chính xác", false, null, null);
            }

            // Chuyển đổi sang DTO
            UserDTO.Response userResponse = userMapper.entityToResponseDTO(user);

            return new AuthDTO.LoginResponse("Đăng nhập thành công", true, userResponse, null);

        } catch (NotFoundException e) {
            return new AuthDTO.LoginResponse("Email hoặc mật khẩu không chính xác", false, null, null);
        } catch (Exception e) {
            return new AuthDTO.LoginResponse("Có lỗi xảy ra trong quá trình đăng nhập", false, null, null);
        }
    }

    public AuthDTO.RegisterResponse register(AuthDTO.RegisterRequest registerRequest) {
        try {
            // Kiểm tra email đã tồn tại
            if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
                return new AuthDTO.RegisterResponse("Email đã được sử dụng", false, null);
            }

            // Kiểm tra mật khẩu xác nhận
            if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
                return new AuthDTO.RegisterResponse("Mật khẩu xác nhận không khớp", false, null);
            }

            // Xác định role cho user
            final String roleName = (registerRequest.getRole() == null || registerRequest.getRole().trim().isEmpty()) 
                    ? "Patient" 
                    : registerRequest.getRole();
            
            // Tìm role
            Role userRole = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy role: " + roleName));

            // Tạo user mới
            User newUser = new User();
            newUser.setEmail(registerRequest.getEmail());
            newUser.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            newUser.setFirstName(registerRequest.getFirstName());
            newUser.setLastName(registerRequest.getLastName());
            newUser.setPhone(registerRequest.getPhone());
            newUser.setGender(registerRequest.getGender());
            newUser.setDateOfBirth(registerRequest.getDateOfBirth());
            newUser.setAddress(registerRequest.getAddress());
            newUser.setStatus(User.UserStatus.ACTIVE);
            newUser.setRole(userRole);

            // Lưu user
            User savedUser = userRepository.save(newUser);
            
            // Tạo Doctor hoặc Patient dựa trên role
            try {
                if ("Doctor".equalsIgnoreCase(roleName)) {
                    createDoctor(savedUser, registerRequest);
                } else if ("Patient".equalsIgnoreCase(roleName)) {
                    createPatient(savedUser, registerRequest);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error creating Doctor/Patient, but User was created: " + e.getMessage());
                // Không throw exception để User vẫn được tạo
            }
            
            // Gửi email chào mừng thông minh
            try {
                System.out.println("🔄 Bắt đầu gửi email chào mừng cho: " + savedUser.getEmail());
                sendWelcomeEmail(savedUser);
                System.out.println("✅ Email chào mừng đã được gửi thành công!");
            } catch (Exception e) {
                // Không throw exception để không ảnh hưởng đến việc tạo tài khoản
                System.err.println("❌ LỖI: Không thể gửi email chào mừng: " + e.getMessage());
                e.printStackTrace();
            }

            // Chuyển đổi sang DTO
            UserDTO.Response userResponse = userMapper.entityToResponseDTO(savedUser);

            return new AuthDTO.RegisterResponse("Đăng ký thành công", true, userResponse);

        } catch (ConflictException e) {
            return new AuthDTO.RegisterResponse("Email đã được sử dụng", false, null);
        } catch (Exception e) {
            return new AuthDTO.RegisterResponse("Có lỗi xảy ra trong quá trình đăng ký", false, null);
        }
    }
    
    private void createDoctor(User user, AuthDTO.RegisterRequest request) {
        try {
            Doctor doctor = new Doctor();
            doctor.setDoctorId(user.getId()); // Set doctorId = userId
            doctor.setUser(user);
            doctor.setSpecialty(request.getSpecialty() != null ? request.getSpecialty() : "Chưa xác định");
            doctor.setBio(request.getBio() != null ? request.getBio() : "Chưa có thông tin");
            
            // Department là bắt buộc trong database, tìm department mặc định nếu không có
            Department department = null;
            if (request.getDepartmentId() != null) {
                department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            }
            
            // Nếu không có department, lấy department đầu tiên làm mặc định
            if (department == null) {
                department = departmentRepository.findAll().stream().findFirst().orElse(null);
                if (department == null) {
                    throw new RuntimeException("Không tìm thấy department nào trong hệ thống");
                }
                System.out.println("⚠️ Using default department: " + department.getDepartmentName());
            }
            
            doctor.setDepartment(department);
            doctorRepository.save(doctor);
            System.out.println("✅ Created Doctor for user: " + user.getEmail() + " with ID: " + user.getId());
        } catch (Exception e) {
            System.err.println("❌ Error creating Doctor: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw để transaction rollback
        }
    }
    
    private void createPatient(User user, AuthDTO.RegisterRequest request) {
        try {
            Patient patient = new Patient();
            patient.setPatientId(user.getId()); // Set patientId = userId
            patient.setUser(user);
            patient.setMedicalHistory(request.getMedicalHistory() != null ? request.getMedicalHistory() : "Chưa có thông tin");
            
            patientRepository.save(patient);
            System.out.println("✅ Created Patient for user: " + user.getEmail() + " with ID: " + user.getId());
        } catch (Exception e) {
            System.err.println("❌ Error creating Patient: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw để transaction rollback
        }
    }

    public AuthDTO.LogoutResponse logout(AuthDTO.LogoutRequest logoutRequest) {
        try {
            // Hiện tại chỉ trả về success
            // Sau này sẽ implement:
            // 1. Validate JWT token
            // 2. Add token to blacklist
            // 3. Clear session if any
            
            if (logoutRequest != null && logoutRequest.getToken() != null) {
                // TODO: Implement token invalidation
                System.out.println("DEBUG: Invalidating token: " + logoutRequest.getToken());
            }
            
            return new AuthDTO.LogoutResponse("Đăng xuất thành công", true);
            
        } catch (Exception e) {
            return new AuthDTO.LogoutResponse("Có lỗi xảy ra trong quá trình đăng xuất", false);
        }
    }

    // Fix encoding issues
    private String fixEncoding(String text) {
        if (text == null) return null;
        
        try {
            // Common encoding fixes for Vietnamese characters
            text = text.replace("Ã¹", "ù")
                      .replace("Ã¡", "á")
                      .replace("Ã ", "à")
                      .replace("Ã£", "ã")
                      .replace("Ã¢", "â")
                      .replace("Ã¨", "è")
                      .replace("Ã©", "é")
                      .replace("Ãª", "ê")
                      .replace("Ã¬", "ì")
                      .replace("Ã­", "í")
                      .replace("Ã³", "ó")
                      .replace("Ã²", "ò")
                      .replace("Ãµ", "õ")
                      .replace("Ã´", "ô")
                      .replace("Ã¹", "ù")
                      .replace("Ãº", "ú")
                      .replace("Ã½", "ý")
                      .replace("Ä", "Đ")
                      .replace("Ä'", "đ")
                      // Fix specific Google OAuth encoding issues
                      .replace("TẤ", "Tấn")
                      .replace("TẤ¹ng", "Tùng")
                      .replace("¹ng", "ùng");
            
            System.out.println("DEBUG OAuth: Fixed encoding: '" + text + "'");
            return text;
        } catch (Exception e) {
            System.err.println("ERROR: Failed to fix encoding for: " + text);
            return text;
        }
    }

    // OAuth login/registration (Google)
    public AuthDTO.LoginResponse oauthLogin(String email, String firstName, String lastName, String picture) {
        try {
            System.out.println("DEBUG OAuth: Searching for email = '" + email + "'");
            System.out.println("DEBUG OAuth: Picture URL = '" + picture + "'");
            
            // Fix encoding issues
            System.out.println("DEBUG OAuth: Original firstName = '" + firstName + "'");
            System.out.println("DEBUG OAuth: Original lastName = '" + lastName + "'");
            if (firstName != null) {
                firstName = fixEncoding(firstName);
            }
            if (lastName != null) {
                lastName = fixEncoding(lastName);
            }
            System.out.println("DEBUG OAuth: Fixed firstName = '" + firstName + "'");
            System.out.println("DEBUG OAuth: Fixed lastName = '" + lastName + "'");
            
            // Try to find existing user
            User user = userRepository.findByEmailWithRole(email).orElse(null);
            
            if (user == null) {
                System.out.println("DEBUG OAuth: User not found, creating new user with Patient role");
                
                // Create new user with Patient role
                final String roleName = "Patient";
                Role userRole = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy role: " + roleName));

                User newUser = new User();
                newUser.setEmail(email != null ? email : "");
                newUser.setPasswordHash("oauth_google_user"); // oauth user, dummy password to satisfy validation
                System.out.println("DEBUG OAuth: FirstName from Google = '" + firstName + "'");
                System.out.println("DEBUG OAuth: LastName from Google = '" + lastName + "'");
                newUser.setFirstName(firstName != null && !firstName.trim().isEmpty() ? firstName : "Google");
                newUser.setLastName(lastName != null && !lastName.trim().isEmpty() ? lastName : "User");
                System.out.println("DEBUG OAuth: Set FirstName = '" + newUser.getFirstName() + "'");
                System.out.println("DEBUG OAuth: Set LastName = '" + newUser.getLastName() + "'");
                System.out.println("DEBUG OAuth: Picture value = '" + picture + "'");
                System.out.println("DEBUG OAuth: Picture is null = " + (picture == null));
                System.out.println("DEBUG OAuth: Picture is empty = " + (picture != null && picture.trim().isEmpty()));
                newUser.setAvatarUrl(picture != null && !picture.trim().isEmpty() ? picture : null); // Lưu ảnh Google
                System.out.println("DEBUG OAuth: Setting avatarUrl for new user = '" + picture + "'");
                newUser.setStatus(User.UserStatus.ACTIVE);
                newUser.setRole(userRole);

                user = userRepository.save(newUser);
                System.out.println("DEBUG OAuth: Created new user with ID = " + user.getId());
                
                // Gửi email chào mừng cho tài khoản Google mới tạo
                try {
                    System.out.println("🔄 Bắt đầu gửi email chào mừng cho Google user: " + user.getEmail());
                    sendWelcomeEmail(user);
                    System.out.println("✅ Email chào mừng Google user đã được gửi thành công!");
                } catch (Exception e) {
                    // Không throw exception để không ảnh hưởng đến việc tạo tài khoản
                    System.err.println("❌ LỖI: Không thể gửi email chào mừng cho Google user: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("DEBUG OAuth: Found existing user with ID = " + user.getId() + ", status = " + user.getStatus());
                System.out.println("DEBUG OAuth: Current FirstName = '" + user.getFirstName() + "'");
                System.out.println("DEBUG OAuth: Current LastName = '" + user.getLastName() + "'");
                System.out.println("DEBUG OAuth: New FirstName = '" + firstName + "'");
                System.out.println("DEBUG OAuth: New LastName = '" + lastName + "'");
                
                // Cập nhật thông tin từ Google nếu có
                boolean needsUpdate = false;
                
                // Cập nhật firstName nếu có
                if (firstName != null && !firstName.trim().isEmpty() && !firstName.equals(user.getFirstName())) {
                    user.setFirstName(firstName);
                    needsUpdate = true;
                    System.out.println("DEBUG OAuth: Updated firstName = '" + firstName + "'");
                }
                
                // Cập nhật lastName nếu có
                if (lastName != null && !lastName.trim().isEmpty() && !lastName.equals(user.getLastName())) {
                    user.setLastName(lastName);
                    needsUpdate = true;
                    System.out.println("DEBUG OAuth: Updated lastName = '" + lastName + "'");
                }
                
                // Fix encoding cho user hiện có nếu cần
                String fixedFirstName = fixEncoding(user.getFirstName());
                String fixedLastName = fixEncoding(user.getLastName());
                if (!fixedFirstName.equals(user.getFirstName()) || !fixedLastName.equals(user.getLastName())) {
                    user.setFirstName(fixedFirstName);
                    user.setLastName(fixedLastName);
                    needsUpdate = true;
                    System.out.println("DEBUG OAuth: Fixed encoding for existing user");
                }
                
                // Force update tên từ Google nếu có
                if (firstName != null && !firstName.trim().isEmpty()) {
                    user.setFirstName(firstName);
                    needsUpdate = true;
                    System.out.println("DEBUG OAuth: Force updated firstName from Google = '" + firstName + "'");
                }
                if (lastName != null && !lastName.trim().isEmpty()) {
                    user.setLastName(lastName);
                    needsUpdate = true;
                    System.out.println("DEBUG OAuth: Force updated lastName from Google = '" + lastName + "'");
                }
                
                // Force update avatar từ Google nếu có
                if (picture != null && !picture.trim().isEmpty()) {
                    user.setAvatarUrl(picture);
                    needsUpdate = true;
                    System.out.println("DEBUG OAuth: Force updated avatarUrl from Google = '" + picture + "'");
                }
                
                // Cập nhật ảnh Google nếu có
                System.out.println("DEBUG OAuth: Current user avatarUrl = '" + user.getAvatarUrl() + "'");
                System.out.println("DEBUG OAuth: New picture = '" + picture + "'");
                if (picture != null && !picture.trim().isEmpty() && !picture.equals(user.getAvatarUrl())) {
                    user.setAvatarUrl(picture);
                    needsUpdate = true;
                    System.out.println("DEBUG OAuth: Updated user avatar with Google picture = '" + picture + "'");
                } else {
                    System.out.println("DEBUG OAuth: No avatar update needed");
                }
                
                // Lưu user nếu có thay đổi
                if (needsUpdate) {
                    user = userRepository.save(user);
                    System.out.println("DEBUG OAuth: Saved user with updated information");
                }
                
                // Kiểm tra trạng thái user
                if (user.getStatus() != User.UserStatus.ACTIVE) {
                    return new AuthDTO.LoginResponse("Tài khoản đã bị khóa hoặc không hoạt động", false, null, null);
                }
            }

            UserDTO.Response userResponse = userMapper.entityToResponseDTO(user);
            System.out.println("DEBUG OAuth: Login successful for user = " + user.getEmail());
            System.out.println("DEBUG OAuth: UserResponse avatarUrl = '" + userResponse.getAvatarUrl() + "'");
            return new AuthDTO.LoginResponse("Đăng nhập thành công (Google)", true, userResponse, null);
        } catch (Exception e) {
            System.err.println("ERROR OAuth: " + e.getMessage());
            e.printStackTrace();
            return new AuthDTO.LoginResponse("Đăng nhập OAuth thất bại: " + e.getMessage(), false, null, null);
        }
    }
    
    // Fix all Google users with encoding issues
    public void fixAllGoogleUsers() {
        try {
            List<User> googleUsers = userRepository.findByPasswordHash("oauth_google_user");
            System.out.println("DEBUG: Found " + googleUsers.size() + " Google users to fix");
            
            for (User user : googleUsers) {
                boolean needsUpdate = false;
                
                // Fix firstName
                String originalFirstName = user.getFirstName();
                String fixedFirstName = fixEncoding(originalFirstName);
                if (!fixedFirstName.equals(originalFirstName)) {
                    user.setFirstName(fixedFirstName);
                    needsUpdate = true;
                    System.out.println("DEBUG: Fixed firstName for user " + user.getId() + ": '" + originalFirstName + "' -> '" + fixedFirstName + "'");
                }
                
                // Fix lastName
                String originalLastName = user.getLastName();
                String fixedLastName = fixEncoding(originalLastName);
                if (!fixedLastName.equals(originalLastName)) {
                    user.setLastName(fixedLastName);
                    needsUpdate = true;
                    System.out.println("DEBUG: Fixed lastName for user " + user.getId() + ": '" + originalLastName + "' -> '" + fixedLastName + "'");
                }
                
                if (needsUpdate) {
                    userRepository.save(user);
                    System.out.println("DEBUG: Updated user " + user.getId());
                }
            }
        } catch (Exception e) {
            System.err.println("ERROR: Failed to fix Google users: " + e.getMessage());
        }
    }

    public AuthDTO.ResetPasswordResponse resetPassword(String email, String otp, String newPassword) {
        try {
            // Find user by email
            User user = userRepository.findByEmailWithRole(email)
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với email: " + email));

            // Verify OTP trước khi cho phép reset password
            if (!emailOtpService.verifyOtp(email, otp)) {
                return new AuthDTO.ResetPasswordResponse("Mã OTP không hợp lệ hoặc đã hết hạn", false);
            }

            // Hash and update password
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // Xóa OTP sau khi reset password thành công
            emailOtpService.consumeOtp(email);

            return new AuthDTO.ResetPasswordResponse("Đặt lại mật khẩu thành công", true);
        } catch (NotFoundException e) {
            return new AuthDTO.ResetPasswordResponse("Không tìm thấy người dùng", false);
        } catch (Exception e) {
            return new AuthDTO.ResetPasswordResponse("Lỗi khi đặt lại mật khẩu: " + e.getMessage(), false);
        }
    }
    
    /**
     * Gửi email chào mừng thông minh cho user mới
     */
    private void sendWelcomeEmail(User user) {
        try {
            String roleName = user.getRole() != null ? user.getRole().getName() : "Người dùng";
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
        if ("Doctor".equalsIgnoreCase(roleName)) {
            content.append("👨‍⚕️ Với tài khoản Bác sĩ, bạn có thể:\n");
            content.append("• Quản lý lịch khám và lịch làm việc\n");
            content.append("• Xem danh sách bệnh nhân\n");
            content.append("• Tạo đơn thuốc và hồ sơ bệnh án\n");
            content.append("• Nhận thông báo về lịch khám mới\n\n");
        } else if ("Patient".equalsIgnoreCase(roleName)) {
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
        
        // Thêm thông tin đặc biệt cho Google users
        if (user.getPasswordHash() != null && user.getPasswordHash().equals("oauth_google_user")) {
            content.append("🔗 Đăng nhập bằng Google:\n");
            content.append("• Bạn có thể đăng nhập nhanh bằng tài khoản Google\n");
            content.append("• Thông tin cá nhân được đồng bộ từ Google\n");
            content.append("• Không cần nhớ mật khẩu riêng\n\n");
        }
        
        content.append("📧 Email đăng nhập: ").append(email).append("\n");
        
        // Thông tin đăng nhập khác nhau cho Google vs Regular users
        if (user.getPasswordHash() != null && user.getPasswordHash().equals("oauth_google_user")) {
            content.append("🔗 Đăng nhập: Sử dụng tài khoản Google (không cần mật khẩu)\n\n");
        } else {
            content.append("🔐 Mật khẩu: [Mật khẩu bạn đã đặt]\n\n");
        }
        
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