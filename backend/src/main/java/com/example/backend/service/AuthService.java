package com.example.backend.service;

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

    // OAuth login/registration (Google)
    public AuthDTO.LoginResponse oauthLogin(String email, String firstName, String lastName) {
        try {
            System.out.println("DEBUG OAuth: Searching for email = '" + email + "'");
            
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
                newUser.setFirstName(firstName != null && !firstName.trim().isEmpty() ? firstName : "Google");
                newUser.setLastName(lastName != null && !lastName.trim().isEmpty() ? lastName : "User");
                newUser.setStatus(User.UserStatus.ACTIVE);
                newUser.setRole(userRole);

                user = userRepository.save(newUser);
                System.out.println("DEBUG OAuth: Created new user with ID = " + user.getId());
            } else {
                System.out.println("DEBUG OAuth: Found existing user with ID = " + user.getId() + ", status = " + user.getStatus());
                
                // Kiểm tra trạng thái user
                if (user.getStatus() != User.UserStatus.ACTIVE) {
                    return new AuthDTO.LoginResponse("Tài khoản đã bị khóa hoặc không hoạt động", false, null, null);
                }
            }

            UserDTO.Response userResponse = userMapper.entityToResponseDTO(user);
            System.out.println("DEBUG OAuth: Login successful for user = " + user.getEmail());
            return new AuthDTO.LoginResponse("Đăng nhập thành công (Google)", true, userResponse, null);
        } catch (Exception e) {
            System.err.println("ERROR OAuth: " + e.getMessage());
            e.printStackTrace();
            return new AuthDTO.LoginResponse("Đăng nhập OAuth thất bại: " + e.getMessage(), false, null, null);
        }
    }
}