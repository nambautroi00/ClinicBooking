package com.example.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByStatus(User.UserStatus status, Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE " +
           "(:email IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:firstName IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :firstName, '%'))) AND " +
           "(:lastName IS NULL OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :lastName, '%'))) AND " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:roleId IS NULL OR u.role.id = :roleId)")
    Page<User> findUsersWithFilters(
            @Param("email") String email,
            @Param("firstName") String firstName,
            @Param("lastName") String lastName,
            @Param("status") User.UserStatus status,
            @Param("roleId") Long roleId,
            Pageable pageable
    );

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.id = :roleId")
    long countByRoleId(@Param("roleId") Long roleId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role")
    Page<User> findAllWithRole(Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.id = :id")
    Optional<User> findByIdWithRole(@Param("id") Long id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmailWithRole(@Param("email") String email);
}


