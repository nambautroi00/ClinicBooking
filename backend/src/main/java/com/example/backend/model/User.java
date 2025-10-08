package com.example.backend.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity class cho bảng Users
 * Chứa thông tin cơ bản của người dùng trong hệ thống
 */
@Entity
@Table(name = "Users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    /**
     * Primary key của bảng Users
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userid")
    private Long userId;

    /**
     * Email của người dùng (unique, not null)
     */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email không được quá 100 ký tự")
    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 255, message = "Mật khẩu phải có ít nhất 6 ký tự")
    @Column(name = "PasswordHash", nullable = false)
    private String passwordHash;

    /**
     * Tên của người dùng
     */
    @NotBlank(message = "Tên không được để trống")
    @Size(max = 50, message = "Tên không được quá 50 ký tự")
    @Column(name = "first_name", nullable = false)
    private String firstName;

    /**
     * Họ của người dùng
     */
    @NotBlank(message = "Họ không được để trống")
    @Size(max = 50, message = "Họ không được quá 50 ký tự")
    @Column(name = "last_name", nullable = false)
    private String lastName;

    /**
     * Số điện thoại
     */
    @Size(max = 20, message = "Số điện thoại không được quá 20 ký tự")
    @Column(name = "phone")
    private String phone;

    /**
     * Giới tính
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    /**
     * Ngày sinh
     */
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    /**
     * Địa chỉ
     */
    @Size(max = 255, message = "Địa chỉ không được quá 255 ký tự")
    @Column(name = "address")
    private String address;

    /**
     * Trạng thái của người dùng
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private UserStatus status = UserStatus.ACTIVE;

    /**
     * Foreign key tới bảng Roles
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roleid", referencedColumnName = "roleid", nullable = false)
    private Role role;

    /**
     * Quan hệ OneToOne với Doctor (nếu user là doctor)
     * @JsonIgnore để tránh LazyInitializationException khi serialize JSON
     */
    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private Doctor doctor;

    /**
     * Quan hệ OneToOne với Patient (nếu user là patient)
     * @JsonIgnore để tránh LazyInitializationException khi serialize JSON
     */
    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private Patient patient;

    /**
     * Enum cho giới tính
     */
    public enum Gender {
        MALE("M"), FEMALE("F"), OTHER("O");
        
        private final String code;
        
        Gender(String code) {
            this.code = code;
        }
        
        public String getCode() {
            return code;
        }
    }

    /**
     * Enum cho trạng thái người dùng
     */
    public enum UserStatus {
        ACTIVE, INACTIVE, SUSPENDED, DELETED
    }

    /**
     * Kiểm tra xem user có phải là Doctor không
     * @return true nếu roleid = 2 (Doctor)
     */
    public boolean isDoctor() {
        try {
            return this.role != null && this.role.getId() != null && this.role.getId() == 2L;
        } catch (Exception e) {
            // Tránh lỗi Hibernate proxy
            return false;
        }
    }

    /**
     * Kiểm tra xem user có phải là Patient không
     * @return true nếu roleid = 3 (Patient)
     */
    public boolean isPatient() {
        try {
            return this.role != null && this.role.getId() != null && this.role.getId() == 3L;
        } catch (Exception e) {
            // Tránh lỗi Hibernate proxy
            return false;
        }
    }
}


