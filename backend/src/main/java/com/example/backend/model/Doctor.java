package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

/**
 * Entity class cho bảng Doctor
 * Thông tin bổ sung của bác sĩ, có quan hệ OneToOne với User
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Doctor")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Doctor {
    
    /**
     * Primary key tự tăng
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doctorid")
    private Long doctorId;

    /**
     * User ID - foreign key tới Users
     */
    @Column(name = "userid")
    private Long userId;

    /**
     * Quan hệ ManyToOne với User
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userid", insertable = false, updatable = false)
    private User user;

    /**
     * Tiểu sử của bác sĩ
     */
    @Column(name = "bio")
    private String bio;

    /**
     * Chuyên khoa của bác sĩ
     */
    @Column(name = "specialty")
    private String specialty;

    /**
     * Ngày tạo bản ghi
     */
    @Column(name = "created_at")
    private LocalDate createdAt;

    /**
     * Trạng thái của bác sĩ
     */
    @Column(name = "status")
    private String status;

    /**
     * Foreign key tới Department
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departmentid")
    private Department department;

    /**
     * Danh sách lịch làm việc của bác sĩ
     */
    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY)
    private List<DoctorSchedule> schedules;

    /**
     * Danh sách cuộc hẹn của bác sĩ
     */
    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY)
    private List<Appointment> appointments;

    /**
     * Danh sách đánh giá của bác sĩ
     */
    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY)
    private List<Review> reviews;

    /**
     * Tự động set createdAt và status khi tạo mới
     */
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDate.now();
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "ACTIVE";
        }
    }
}