package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.model.User;

/**
 * Repository interface cho User entity
 * Chứa các query methods để truy vấn dữ liệu người dùng
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm user theo email
     */
    Optional<User> findByEmail(String email);

    /**
     * Kiểm tra email đã tồn tại chưa
     */
    boolean existsByEmail(String email);

    /**
     * Tìm user theo status
     */
    Page<User> findByStatus(User.UserStatus status, Pageable pageable);

    /**
     * Tìm user với các bộ lọc
     */
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

    /**
     * Đếm số user theo roleId
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.id = :roleId")
    long countByRoleId(@Param("roleId") Long roleId);

    /**
     * Lấy tất cả user với thông tin role
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role")
    Page<User> findAllWithRole(Pageable pageable);

    /**
     * Tìm user theo ID với thông tin role
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.userId = :id")
    Optional<User> findByIdWithRole(@Param("id") Long id);

    /**
     * Tìm user theo email với thông tin role
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmailWithRole(@Param("email") String email);

    /**
     * Lấy tất cả user cùng dữ liệu Doctor/Patient nếu có
     * Query join với Doctor và Patient tables
     */
    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.role r " +
           "LEFT JOIN FETCH u.doctor d " +
           "LEFT JOIN FETCH u.patient p " +
           "ORDER BY u.firstName, u.lastName")
    List<User> findAllWithDoctorAndPatientInfo();

    /**
     * Tìm user theo roleId với thông tin Doctor/Patient
     */
    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.role r " +
           "LEFT JOIN FETCH u.doctor d " +
           "LEFT JOIN FETCH u.patient p " +
           "WHERE r.id = :roleId " +
           "ORDER BY u.firstName, u.lastName")
    List<User> findByRoleIdWithDoctorAndPatientInfo(@Param("roleId") Long roleId);

    /**
     * Tìm user theo tên với thông tin Doctor/Patient
     */
    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.role r " +
           "LEFT JOIN FETCH u.doctor d " +
           "LEFT JOIN FETCH u.patient p " +
           "WHERE (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
           "ORDER BY u.firstName, u.lastName")
    List<User> findByNameContainingWithDoctorAndPatientInfo(@Param("keyword") String keyword);
}


