package com.example.backend.service;

import com.example.backend.dto.UserDto;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository, RoleRepository roleRepository){
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    // Convert User to UserDto
    private UserDto toDto(User user) {
        return new UserDto(
                user.getUserID(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getGender(),
                user.getAddress(),
                user.getStatus(),
                user.getRole() != null ? user.getRole().getRoleID() : null
        );
    }

    // Convert UserDto to User
    private User toEntity(UserDto dto) {
        User user = new User();
        user.setUserID(dto.getUserID());
        user.setEmail(dto.getEmail());
        if (dto.getPasswordHash() != null && !dto.getPasswordHash().isEmpty()) {
            user.setPasswordHash(dto.getPasswordHash());
        }
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhone(dto.getPhone());
        user.setGender(dto.getGender());
        user.setAddress(dto.getAddress());
        user.setStatus(dto.getStatus());
        if (dto.getRoleID() != null) {
            Optional<Role> role = roleRepository.findById(dto.getRoleID());
            if (role.isPresent()) {
                user.setRole(role.get());
            } else {
                throw new IllegalArgumentException("roleID not found: " + dto.getRoleID());
            }
        }
        return user;
    }

    // Create
    public UserDto createUser(UserDto userDto) {
        User user = toEntity(userDto);
        // Ensure createdAt is set on create
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(java.time.LocalDateTime.now());
        }
        // role is required by User mapping (nullable=false). Fail early if missing.
        if (userDto.getRoleID() == null) {
            throw new IllegalArgumentException("roleID is required");
        }
        // passwordHash is required by User mapping (nullable=false)
        if (userDto.getPasswordHash() == null || userDto.getPasswordHash().isEmpty()) {
            throw new IllegalArgumentException("passwordHash is required");
        }
        User saved = userRepository.save(user);
        return toDto(saved);
    }

    // Read all
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    // Read by ID
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return toDto(user);
    }

    // Update
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        user.setEmail(userDto.getEmail());
        if (userDto.getPasswordHash() != null && !userDto.getPasswordHash().isEmpty()) {
            user.setPasswordHash(userDto.getPasswordHash());
        }
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setPhone(userDto.getPhone());
        user.setGender(userDto.getGender());
        user.setAddress(userDto.getAddress());
        user.setStatus(userDto.getStatus());
        if (userDto.getRoleID() != null) {
            Optional<Role> role = roleRepository.findById(userDto.getRoleID());
            if (role.isPresent()) {
                user.setRole(role.get());
            } else {
                throw new IllegalArgumentException("roleID not found: " + userDto.getRoleID());
            }
        }
        User updated = userRepository.save(user);
        return toDto(updated);
    }

    // Delete
    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
