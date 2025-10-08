package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

/**
 * Entity class cho bảng Patient
 * Thông tin bổ sung của bệnh nhân, có quan hệ OneToOne với User
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Patient")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Patient {
    
    /**
     * Primary key tự tăng
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patientid")
    private Long patientId;

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
     * Số bảo hiểm y tế
     */
    @Column(name = "health_insurance_number")
    private String healthInsuranceNumber;

    /**
     * Tiền sử bệnh
     */
    @Column(name = "medical_history", columnDefinition = "NVARCHAR(MAX)")
    private String medicalHistory;

    /**
     * Ngày tạo bản ghi
     */
    @Column(name = "created_at")
    private LocalDate createdAt;

    /**
     * Trạng thái của bệnh nhân
     */
    @Column(name = "status")
    private String status;

    /**
     * Danh sách cuộc hẹn của bệnh nhân
     */
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY)
    private List<Appointment> appointments;

    /**
     * Danh sách đánh giá của bệnh nhân
     */
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY)
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