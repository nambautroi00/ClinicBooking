package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.config.SecurityConfig.SimplePasswordEncoder;
import com.example.backend.dto.AuthDTO;
import com.example.backend.dto.UserDTO;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.NotFoundException;
import com.example.backend.mapper.UserMapper;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final SimplePasswordEncoder passwordEncoder;

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
            
            // Chuyển đổi sang DTO
            UserDTO.Response userResponse = userMapper.entityToResponseDTO(savedUser);

            return new AuthDTO.RegisterResponse("Đăng ký thành công", true, userResponse);

        } catch (ConflictException e) {
            return new AuthDTO.RegisterResponse("Email đã được sử dụng", false, null);
        } catch (Exception e) {
            return new AuthDTO.RegisterResponse("Có lỗi xảy ra trong quá trình đăng ký", false, null);
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
}