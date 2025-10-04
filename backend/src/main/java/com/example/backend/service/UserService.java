package com.example.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.config.SecurityConfig.SimplePasswordEncoder;
import com.example.backend.constant.AppConstants;
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
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SimplePasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public Page<UserDTO.Response> getAllUsers(Pageable pageable) {
        return userRepository.findAllWithRole(pageable).map(userMapper::entityToResponseDTO);
    }

    @Transactional(readOnly = true)
    public UserDTO.Response getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(String.format(AppConstants.USER_NOT_FOUND_BY_ID, id)));
        return userMapper.entityToResponseDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO.Response getUserByEmail(String email) {
        User user = userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new NotFoundException(String.format(AppConstants.USER_NOT_FOUND_BY_EMAIL, email)));
        return userMapper.entityToResponseDTO(user);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO.Response> searchUsers(String email, String firstName, String lastName, 
                                           User.UserStatus status, Long roleId, Pageable pageable) {
        return userRepository.findUsersWithFilters(email, firstName, lastName, status, roleId, pageable)
                .map(userMapper::entityToResponseDTO);
    }

    public UserDTO.Response createUser(UserDTO.Create createDTO) {
        validateEmailNotExists(createDTO.getEmail());
        Role role = validateAndGetRole(createDTO.getRoleId());
        
        User user = buildUserFromCreateDTO(createDTO, role);
        User savedUser = userRepository.save(user);
        
        return userMapper.entityToResponseDTO(savedUser);
    }

    public UserDTO.Response updateUser(Long id, UserDTO.Update updateDTO) {
        User user = findUserById(id);
        updateUserFields(user, updateDTO);
        User updatedUser = userRepository.save(user);
        return userMapper.entityToResponseDTO(updatedUser);
    }

    public void deleteUser(Long id) {
        User user = findUserById(id);
        // Soft delete - chỉ thay đổi status
        user.setStatus(User.UserStatus.DELETED);
        userRepository.save(user);
    }

    public void hardDeleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new NotFoundException(String.format(AppConstants.USER_NOT_FOUND_BY_ID, id));
        }
        userRepository.deleteById(id);
    }

    // Helper Methods
    private void validateEmailNotExists(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException(String.format(AppConstants.EMAIL_ALREADY_EXISTS, email));
        }
    }

    private Role validateAndGetRole(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException(String.format(AppConstants.ROLE_NOT_FOUND, roleId)));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(String.format(AppConstants.USER_NOT_FOUND_BY_ID, id)));
    }

    private User buildUserFromCreateDTO(UserDTO.Create createDTO, Role role) {
        String encodedPassword = passwordEncoder.encode(createDTO.getPassword());
        return userMapper.createDTOToEntity(createDTO, role, encodedPassword);
    }

    private void updateUserFields(User user, UserDTO.Update updateDTO) {
        updateEmailIfChanged(user, updateDTO.getEmail());
        updatePasswordIfProvided(user, updateDTO.getPassword());
        updateBasicFields(user, updateDTO);
        updateRoleIfProvided(user, updateDTO.getRoleId());
    }

    private void updateEmailIfChanged(User user, String newEmail) {
        if (newEmail != null && !newEmail.equals(user.getEmail())) {
            validateEmailNotExists(newEmail);
            user.setEmail(newEmail);
        }
    }

    private void updatePasswordIfProvided(User user, String newPassword) {
        if (newPassword != null) {
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }
    }

    private void updateBasicFields(User user, UserDTO.Update updateDTO) {
        if (updateDTO.getFirstName() != null) user.setFirstName(updateDTO.getFirstName());
        if (updateDTO.getLastName() != null) user.setLastName(updateDTO.getLastName());
        if (updateDTO.getPhone() != null) user.setPhone(updateDTO.getPhone());
        if (updateDTO.getGender() != null) user.setGender(updateDTO.getGender());
        if (updateDTO.getDateOfBirth() != null) user.setDateOfBirth(updateDTO.getDateOfBirth());
        if (updateDTO.getAddress() != null) user.setAddress(updateDTO.getAddress());
        if (updateDTO.getStatus() != null) user.setStatus(updateDTO.getStatus());
    }

    private void updateRoleIfProvided(User user, Long roleId) {
        if (roleId != null) {
            Role role = validateAndGetRole(roleId);
            user.setRole(role);
        }
    }


}


