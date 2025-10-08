package com.example.backend.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.backend.model.User;
import com.example.backend.service.UserService;

import lombok.RequiredArgsConstructor;

/**
 * REST Controller cho User entity
 * Cung cấp các API endpoints để quản lý thông tin người dùng
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    /**
     * Lấy tất cả user với thông tin role
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<Page<User>> getAllUsersWithRole(Pageable pageable) {
        Page<User> users = userService.getAllUsersWithRole(pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * Lấy user theo ID với thông tin role
     * GET /api/users/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<User> getUserByIdWithRole(@PathVariable Long userId) {
        User user = userService.getUserByIdWithRole(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * Lấy user theo email với thông tin role
     * GET /api/users/email/{email}
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmailWithRole(@PathVariable String email) {
        User user = userService.getUserByEmailWithRole(email);
        return ResponseEntity.ok(user);
    }

    /**
     * Tìm user với các bộ lọc
     * GET /api/users/search?email=...&firstName=...&lastName=...&status=...&roleId=...
     */
    @GetMapping("/search")
    public ResponseEntity<Page<User>> searchUsersWithFilters(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(required = false) Long roleId,
            Pageable pageable) {
        
        Page<User> users = userService.searchUsersWithFilters(email, firstName, lastName, status, roleId, pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * Lấy tất cả user với thông tin role
     * GET /api/users/with-roles-info
     */
    @GetMapping("/with-roles-info")
    public ResponseEntity<List<User>> getAllUsersWithRoleInfo() {
        List<User> users = userService.getAllUsersWithRoleInfo();
        return ResponseEntity.ok(users);
    }

    /**
     * Lấy user theo roleId với thông tin role
     * GET /api/users/role/{roleId}/with-roles-info
     */
    @GetMapping("/role/{roleId}/with-roles-info")
    public ResponseEntity<List<User>> getUsersByRoleIdWithRoleInfo(@PathVariable Long roleId) {
        List<User> users = userService.getUsersByRoleIdWithRoleInfo(roleId);
        return ResponseEntity.ok(users);
    }

    /**
     * Tìm user theo tên với thông tin role
     * GET /api/users/search-with-roles-info?keyword={keyword}
     */
    @GetMapping("/search-with-roles-info")
    public ResponseEntity<List<User>> getUsersByNameWithRoleInfo(@RequestParam String keyword) {
        List<User> users = userService.getUsersByNameWithRoleInfo(keyword);
        return ResponseEntity.ok(users);
    }

    /**
     * Tạo user mới
     * POST /api/users
     */
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest request) {
        User user = userService.createUser(
            request.getEmail(),
            request.getPasswordHash(),
            request.getFirstName(),
            request.getLastName(),
            request.getPhone(),
            request.getGender(),
            request.getDateOfBirth(),
            request.getAddress(),
            request.getRoleId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    /**
     * Cập nhật thông tin user
     * PUT /api/users/{userId}
     */
    @PutMapping("/{userId}")
    public ResponseEntity<User> updateUser(@PathVariable Long userId, @RequestBody UpdateUserRequest request) {
        User user = userService.updateUser(
            userId,
            request.getEmail(),
            request.getFirstName(),
            request.getLastName(),
            request.getPhone(),
            request.getGender(),
            request.getDateOfBirth(),
            request.getAddress(),
            request.getStatus(),
            request.getRoleId()
        );
        return ResponseEntity.ok(user);
    }

    /**
     * Xóa user (soft delete)
     * DELETE /api/users/{userId}
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Xóa user vĩnh viễn (hard delete)
     * DELETE /api/users/{userId}/hard
     */
    @DeleteMapping("/{userId}/hard")
    public ResponseEntity<Void> hardDeleteUser(@PathVariable Long userId) {
        userService.hardDeleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Đếm số user theo roleId
     * GET /api/users/count-by-role/{roleId}
     */
    @GetMapping("/count-by-role/{roleId}")
    public ResponseEntity<Long> countUsersByRoleId(@PathVariable Long roleId) {
        long count = userService.countUsersByRoleId(roleId);
        return ResponseEntity.ok(count);
    }

    /**
     * Kiểm tra email đã tồn tại chưa
     * GET /api/users/check-email/{email}
     */
    @GetMapping("/check-email/{email}")
    public ResponseEntity<Boolean> isEmailExists(@PathVariable String email) {
        boolean exists = userService.isEmailExists(email);
        return ResponseEntity.ok(exists);
    }

    /**
     * Request DTO cho tạo user mới
     */
    public static class CreateUserRequest {
        private String email;
        private String passwordHash;
        private String firstName;
        private String lastName;
        private String phone;
        private User.Gender gender;
        private java.time.LocalDate dateOfBirth;
        private String address;
        private Long roleId;

        // Getters and Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPasswordHash() { return passwordHash; }
        public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
        
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public User.Gender getGender() { return gender; }
        public void setGender(User.Gender gender) { this.gender = gender; }
        
        public java.time.LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(java.time.LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        
        public Long getRoleId() { return roleId; }
        public void setRoleId(Long roleId) { this.roleId = roleId; }
    }

    /**
     * Request DTO cho cập nhật user
     */
    public static class UpdateUserRequest {
        private String email;
        private String firstName;
        private String lastName;
        private String phone;
        private User.Gender gender;
        private java.time.LocalDate dateOfBirth;
        private String address;
        private User.UserStatus status;
        private Long roleId;

        // Getters and Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public User.Gender getGender() { return gender; }
        public void setGender(User.Gender gender) { this.gender = gender; }
        
        public java.time.LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(java.time.LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        
        public User.UserStatus getStatus() { return status; }
        public void setStatus(User.UserStatus status) { this.status = status; }
        
        public Long getRoleId() { return roleId; }
        public void setRoleId(Long roleId) { this.roleId = roleId; }
    }
}