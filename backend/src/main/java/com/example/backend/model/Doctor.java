package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Doctors")
public class Doctor {
    @Id
    @Column(name = "DoctorID")
    private Long doctorId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "DoctorID")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DepartmentID", nullable = false)
    private Department department;

    @Column(name = "Specialty")
    private String specialty;
    
    @Column(name = "Bio")
    private String bio;

    @Column(name = "CreatedAt")
    private LocalDate createdAt;

    @Column(name = "Status")
    private String status;

    @OneToMany(mappedBy = "doctor")
    private List<DoctorSchedule> schedules;

    @OneToMany(mappedBy = "doctor")
    private List<Appointment> appointments;

    @OneToMany(mappedBy = "doctor")
    private List<Review> reviews;

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