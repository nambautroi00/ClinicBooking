package com.example.backend.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.constant.AppConstants;
import com.example.backend.dto.UserDTO;
import com.example.backend.model.User;
import com.example.backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping(value = {"", "/"})
    public ResponseEntity<Page<UserDTO.Response>> getAllUsers(
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = AppConstants.DEFAULT_SORT_FIELD) Pageable pageable) {
        System.out.println("DEBUG: Getting all users");
        Page<UserDTO.Response> users = userService.getAllUsers(pageable);
        System.out.println("DEBUG: Found " + users.getTotalElements() + " users");
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO.Response> getUserById(@PathVariable Long id) {
        System.out.println("DEBUG: Getting user with ID: " + id);
        UserDTO.Response user = userService.getUserById(id);
        System.out.println("DEBUG: Found user: " + user.getEmail());
        return ResponseEntity.ok(user);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO.Response> getUserByEmail(@PathVariable String email) {
        System.out.println("DEBUG: Getting user with email: " + email);
        UserDTO.Response user = userService.getUserByEmail(email);
        System.out.println("DEBUG: Found user: " + user.getFirstName() + " " + user.getLastName());
        return ResponseEntity.ok(user);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserDTO.Response>> searchUsers(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(required = false) Long roleId,
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = AppConstants.DEFAULT_SORT_FIELD) Pageable pageable) {
        
        System.out.println("DEBUG: Searching users with filters - email: " + email + ", firstName: " + firstName);
        Page<UserDTO.Response> users = userService.searchUsers(email, firstName, lastName, status, roleId, pageable);
        System.out.println("DEBUG: Found " + users.getTotalElements() + " users");
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<UserDTO.Response> createUser(@Valid @RequestBody UserDTO.Create createDTO) {
        UserDTO.Response createdUser = userService.createUser(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @PutMapping(AppConstants.USER_BY_ID)
    public ResponseEntity<UserDTO.Response> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDTO.Update updateDTO) {
        UserDTO.Response updatedUser = userService.updateUser(id, updateDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping(AppConstants.USER_BY_ID)
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping(AppConstants.HARD_DELETE_USER)
    public ResponseEntity<Void> hardDeleteUser(@PathVariable Long id) {
        userService.hardDeleteUser(id);
        return ResponseEntity.noContent().build();
    }
}


